import Mailgen from "mailgen";
import nodemailer from "nodemailer";

/**
 options = {
    email: "tanishk@gmail.com",
    subject: "Verify your email",
    mailgenContent: {
        body: {...}
    }
}

Nodemailer is responsible for actually sending that email through an email server (SMTP).
Mailtrap provides a testing SMTP server/inbox.
 */

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://taskmanagelink.com",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    //"Hi Mailtrap, I want to use your SMTP service. Here are my credentials."
    //This is basically creating a connection/configuration for the email server.
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Email service failed silently. Make sure that you provided your MAILTRAP credentials in the .env file",
    );
    console.error("Error : ", error);
  }
};

const emailVerficationMailgenContent = (username, verificationLink) => {
  return {
    body: {
      intro: "Welcome to our app!  We are excited to have you on board.",
      action: {
        instructions:
          "To verify your email please click on the following button",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationLink,
        },
      },
      outro:
        "Need help, or have any questions? Just reply to this email, we'd love to help",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      intro: "We got a request to reset the password og your account.",
      action: {
        instructions:
          "To reset your password please click on the following button",
        button: {
          color: "#22BC66",
          text: "Reset password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have any questions? Just reply to this email, we'd love to help",
    },
  };
};

export {
  emailVerficationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
