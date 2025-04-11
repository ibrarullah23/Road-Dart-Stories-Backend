import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import User from '../models/User.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();


router.post('/checkout', authMiddleware, async (req, res) => {
    const { plan } = req.body;  // Get the selected plan and email from the frontend
    const userId = req.user.id;
    const email = req.user.email;

    // Set up the priceId for the selected plan

    // const priceMap = {
    //     basic: process.env.BASIC_PLAN_PRICE_ID,
    //     business: process.env.BUSINESS_PLAN_PRICE_ID,
    //     enterprise: process.env.ENTERPRISE_PLAN_PRICE_ID,
    // };
    // const priceId = priceMap[plan];
    // if (!priceId) {
    //     return res.status(400).json({ error: 'Invalid plan selected' });
    // }

    try {
        // Fetch the Product based on the Plan Name
        const product = await stripe.products.list({ limit: 10 });
        const productData = product.data.find(p => p.name.toLowerCase() === plan.toLowerCase());

        if (!productData) {
            return res.status(400).json({ error: 'Plan not found' });
        }

        // Fetch the Price for this Product
        const prices = await stripe.prices.list({
            product: productData.id,
            active: true,  // Only active prices
            limit: 1,      // Get the first active price
        });

        if (prices.data.length === 0) {
            return res.status(400).json({ error: 'No active price found for the selected plan' });
        }

        const priceId = prices.data[0].id;


        // Create a Checkout session with Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],  // Specify allowed payment methods
            line_items: [
                {
                    price: priceId,  // Price ID for the selected plan
                    quantity: 1,  // Only one unit of the plan selected
                },
            ],
            mode: 'subscription',  // Use 'subscription' mode for recurring payments
            customer_email: email,  // Optionally pre-fill the email field for the user
            success_url: `${process.env.ALLOWED_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,  // Redirect on success
            cancel_url: `${process.env.ALLOWED_ORIGIN}/cancel`,  // Redirect on cancel
            // proration_behavior: 'create_prorations',
            allow_promotion_codes: true,
            metadata: {
                userId: userId,  // Store the userId in the metadata
            },
        });

        // Send back the session ID to the frontend for Stripe Checkout redirection
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).send(error.message);
    }
});


// Assuming you're using Express and have the stripe instance set up
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id; // Assuming you use middleware to get logged in user

    try {
        // 1. Get user's subscription ID from DB
        const user = await User.findById(userId); // Or however you fetch user
        const subscriptionId = user.stripeSubscriptionId;

        if (!subscriptionId) {
            return res.status(404).json({ error: 'No subscription found for this user' });
        }

        // 2. Fetch subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // 3. Parse and return the details
        const currentPlan = subscription.items.data[0].price.nickname || subscription.items.data[0].price.id;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000); // UNIX timestamp → Date
        const cancelAtPeriodEnd = !subscription.cancel_at_period_end;

        return res.json({
            plan: currentPlan,
            currentPeriodEnd,
            cancelAtPeriodEnd,
            status: subscription.status, // valuses will be active, past_due, canceled, incomplete, unpaid
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        if (error.type === 'StripeCardError') {
            res.status(400).json({ error: 'Your card was declined' });
        } else if (error.type === 'StripeInvalidRequestError') {
            res.status(400).json({ error: 'Invalid parameters passed to Stripe API' });
        } else {
            res.status(500).json({ error: 'Internal server error. Please try again later.' });
        }
    }
});

router.get('/checkout/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching session details from Stripe' });
    }
  });


router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('❌ Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const subscriptionId = session.subscription;

            const user = await User.findById(userId);
            if (user) {
                user.stripeSubscriptionId = subscriptionId;
                await user.save();
                console.log(`✅ Subscription stored for ${userId}`);
            } else {
                console.warn(`⚠️ No user found for email: ${userId}`);
            }
        }
    } catch (error) {
        console.error('Error processing webhook event:', error);
        return res.status(500).send('Failed to process webhook');
    }

    res.status(200).send('Webhook received');
});


// Endpoint for canceling subscription
router.post('/cancel', async (req, res) => {
    const userId = req.user.id;  // Ensure req.user is set by authentication middleware

    try {
        // Get user's subscription ID from DB (directly from the User model)
        const user = await User.findById(userId);
        if (!user || !user.stripeSubscriptionId) {
            return res.status(404).json({ error: 'No subscription found for this user' });
        }

        // Cancel subscription in Stripe (at the end of the current period)
        const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: true, // This cancels the subscription at the end of the billing cycle
        });

        // Optionally, you can cancel immediately by using cancel_at_period_end: false

        // Update user's subscription status in DB (optional)
        user.stripeSubscriptionId = null; // Remove the stripe subscription ID, or you can keep it if needed
        await user.save();

        res.status(200).json({ message: 'Subscription canceled successfully' });

    } catch (error) {
        console.error('Error fetching subscription details:', error);
        if (error.type === 'StripeInvalidRequestError') {
            res.status(400).json({ error: 'Invalid request to Stripe API' });
        } else if (error.type === 'StripeAPIError') {
            res.status(500).json({ error: 'Stripe API error occurred' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});





export default router;