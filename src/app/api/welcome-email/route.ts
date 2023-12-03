import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request,) {
  const {email,name} = await req.json()

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'jaylimbachiya043@gmail.com',
      pass: 'clon zong iobg wqes',
    },
    
  });

  

  const mailOptions = {
    from: 'jaylimbachiya043@gmail.com',
    to: email,
    subject: 'Welcome to The Special Character',
    html:   `<p>hey ${name}, youre attadace sucsessfuall noted</p>`,
  };

  try {

    transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
    await transporter.sendMail(mailOptions);
    return NextResponse.json({
      message: `Welcome email sent to ${email}`,
    });
  } catch (error: any) {
    return NextResponse.json({
      message: `Error sending welcome email: ${error.message}`,
    });
  }
}
