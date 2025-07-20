package internal

import (
	"github.com/ductruonghoc/DATN_08_2025_Back-end/config"
	
	"gopkg.in/gomail.v2"

	"fmt"
);

func GetEmailCredentials() (string, string, string) {
	email := "graduateproject26@gmail.com";
	password := config.GetEnv("SMTP_PWD", "");
	smtp_server := "smtp.gmail.com";

	return email, password, smtp_server;
}

// sendEmail sends an OTP via email using Gomail and SMTP
func EmailOTP(to string, otp string) error {
	//Get recent config credentials
	email, password, smtp_server := GetEmailCredentials();
	
	//mail object
	m := gomail.NewMessage();
	m.SetHeader("From", email);
	m.SetHeader("To", to);
	m.SetHeader("Subject", "Your OTP Code");
	m.SetBody("text/plain", fmt.Sprintf("Your OTP code is: %s", otp));

	d := gomail.NewDialer(smtp_server, 587, email, password);

	return d.DialAndSend(m);
}