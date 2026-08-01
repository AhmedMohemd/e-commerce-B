import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from 'Stripe'
@Injectable()
export class PaymentService {

    private stripe!: Stripe;
    constructor(
        private readonly configService: ConfigService
    ) {
        this.stripe = new Stripe(this.configService.get<string>("STRIPE_SECRET_KEY") as string)
    }
    async checkout(
        {
            customer_email,
            metadata = {},
            cancel_url = this.configService.get("CANCEL_URL") as string,
            success_url = this.configService.get("SUCCESS_URL") as string,
            discounts = [],
            mode = "payment",
            line_items
        }: Stripe.Checkout.SessionCreateParams
    ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
        const session = await this.stripe.checkout.sessions.create({
            customer_email,
            metadata,
            cancel_url,
            success_url,
            discounts,
            mode,
            line_items
        })
        return session;
    }
    async createCoupon(
        data: Stripe.CouponCreateParams
    ): Promise<Stripe.Response<Stripe.Coupon>> {
        return await this.stripe.coupons.create(data)
    }
    async createPaymentMethod(token: string) {
        return await this.stripe.paymentMethods.create({
            type: "card",
            card: {
                token
            }
        })
    }
    async createPaymentIntent(data: Stripe.PaymentIntentCreateParams) {
        return await this.stripe.paymentIntents.create(data)
    }


    async webhook(req: Request): Promise<Stripe.CheckoutSessionCompletedEvent> {
        let event: Stripe.Event = this.stripe.webhooks.constructEvent(
            req.body as unknown as Buffer,
            req.headers['stripe-signature'] as string,
            this.configService.get("STRIPE_HOOK_SECRET") as string
        );
        // Handle the event
        if (event.type != 'checkout.session.completed') {
            throw new BadRequestException("Fail to pay")
        }
        console.log({ event, metadata: event.data.object.metadata });
        return event
    }

    async retrievePaymentIntent(intentId: string) {
        const intent = await this.stripe.paymentIntents.retrieve(intentId);
        if (!intent) {
            throw new NotFoundException("Invalid intent Id")
        }
        return intent
    }
    async confirmPaymentIntent(intentId: string) {
        const intent = await this.retrievePaymentIntent(intentId)
        if (intent.status != 'requires_confirmation') {
            throw new BadRequestException("Invalid intent status")
        }
        return await this.stripe.paymentIntents.confirm(intentId)
    }
    async refund(intentId: string) {
        const intent = await this.retrievePaymentIntent(intentId)
        if (intent.status != 'succeeded') {
            throw new BadRequestException("Invalid intent status")

        }
        return await this.stripe.refunds.create({ payment_intent: intentId })
    }
}