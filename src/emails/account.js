const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    const msg = {
        to: email, // Change to your recipient
        from: 'sainabd31@gmail.com', // Change to your verified sender
        subject: 'Thanks for Joining in!',
        text: `
        Welcome to the app ${name}.
        Let me know you get along with the app.
        `,
        html: `
        <h2>Welcome to the app <strong>${name}</strong>.</h2>
        <p>
        Let me know if you get along with the app.
        </p>
        `,
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error.response.body)
        })
}

const sendCancellationEmail = async (email, name) => {
    const msg = {
        to: email,
        from: 'sainabd31@gmail.com',
        subject: 'Account Deleted',
        text: `We are sad to see you leave ${name}. Please let us know if you have feedback about our app.`
    }
    try {
        await sgMail.send(msg)
        console.log('Email sent')
    } catch (err) {
        console.error(err.response.body);
    }

}

module.exports = { sendWelcomeEmail, sendCancellationEmail }