import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { createTransport } from "nodemailer";

import moduleRoutes from "./routes/moduleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config()
connectDB()

const port = process.env.port || 5000;
const allowedOrigin = "https://quizitalian-90795058235.us-central1.run.app";

const app = express();

app.use(bodyParser.json({ limit: "30mb", extended: true}))
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true}))
app.use(cors());

app.use('/api/modules', moduleRoutes);
app.use('/api/user', userRoutes);
app.use('/api/reviews', reviewRoutes);

app.listen(port, () => console.log(`Server started on port ${port}`));

function sendEmail({ recipient_email, OTP }) {
  return new Promise((resolve, reject) => {
    var transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mail_configs = {
      from: process.env.EMAIL,
      to: recipient_email,
      subject: "QuizItalian Password Recovery",
      html: 
      `<!DOCTYPE html>
      <html lang="en" >
      <head>
          <meta charset="UTF-8">
          <title>CodePen - OTP Email Template</title>        
      </head>
      <body>
      <!-- partial:index.partial.html -->
      <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
          <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
              <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">QuizItalian</a>
          </div>
          <p style="font-size:1.1em">Hi,</p>
          <p>Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 5 minutes</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
          <p style="font-size:0.9em;">Regards,<br />QuizItalian</p>
          <hr style="border:none;border-top:1px solid #eee" />
          <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
              <p>\QuizItalian</p>
              <p>Ontario</p>
              <p>Canada</p>
          </div>
          </div>
      </div>
      <!-- partial -->    
      </body>
      </html>`,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: `An error has occured` });
      }
      return resolve({ message: "Email sent succesfuly" });
    });
  });
}

app.post("/send_recovery_email", (req, res) => {
  console.log(req.body);
  sendEmail(req.body)
    .then((response) => res.send(response.message))
    .catch((error) => res.status(500).send(error.message));
});

