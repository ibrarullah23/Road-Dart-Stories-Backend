export const WELCOME = (email, firstname) => {



    const data = {
        subject: "Welcome to Road Dart Stories",
        recipient: email,
        html: `
<h1>Welcome to Road Dart Stories!</h1>
<p>Dear ${firstname},</p>
<p>We're thrilled to have you join the Road Darts community — where opportunity meets innovation. Our platform is designed to help professionals like you connect, collaborate, and grow with confidence.</p>
<p>Whether you're here to discover high-quality listings, build powerful partnerships, or expand your business reach, you're in the right place.</p>
<p>Here's how you can get started:</p>
<ul>
    <li>Complete your profile to showcase your expertise.</li>
    <li>Explore top-tier listings and services.</li>
    <li>Engage with other professionals and businesses.</li>
</ul>
<p>If you need support or have any questions, our team is always here to help.</p>
<p>Welcome aboard — let's redefine what's possible together.</p>
<p>Best regards,</p>
<p>The Road Darts Team</p>
<a href="${process.env.ALLOWED_ORIGIN}" class="button">Get Started</a>
`
    }

    return data

};