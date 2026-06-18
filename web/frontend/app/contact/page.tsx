"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, Facebook, Twitter, Instagram } from "lucide-react";
import { toast } from "sonner";
import Axios from "@/config/axios.config";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const MotionButton = motion(Button);
const MotionInput = motion(Input);

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const contactRef = useRef(null);
  const contactInView = useInView(contactRef, { once: true, amount: 0.2 });

  const [formData, setFormData] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Axios.post("/contact/send-email/", {
        to: "yasela2014@gmail.com",
        ...formData,
      });
      toast("Success", {
        description: "Your message has been sent successfully!",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch {
      toast("Error", {
        description: "Failed to send message. Please try again.",
      });
    }
  };

  return (
    <>
      <PublicNavbar />
      <section ref={contactRef} className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            animate={contactInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
              variants={fadeIn}
            >
              Contact Us
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              variants={fadeIn}
            >
              Have questions or need assistance? We&apos;re here to help!
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto"
            initial="hidden"
            animate={contactInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {/* Contact Form */}
            <motion.div variants={fadeIn}>
              <motion.h3
                className="text-2xl font-bold text-gray-900 mb-6"
                variants={fadeIn}
              >
                Send Us a Message
              </motion.h3>
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-4"
                variants={staggerContainer}
              >
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  variants={staggerContainer}
                >
                  <motion.div variants={fadeIn}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <MotionInput
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    />
                  </motion.div>
                  <motion.div variants={fadeIn}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <MotionInput
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    />
                  </motion.div>
                </motion.div>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  variants={staggerContainer}
                >
                  <motion.div variants={fadeIn}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <MotionInput
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    />
                  </motion.div>
                  <motion.div variants={fadeIn}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <MotionInput
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    />
                  </motion.div>
                </motion.div>
                <motion.div variants={fadeIn}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <MotionInput
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  />
                </motion.div>
                <motion.div variants={fadeIn}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <motion.textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  />
                </motion.div>
                <motion.div variants={fadeIn}>
                  <MotionButton
                    type="submit"
                    className="w-full text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Send Message
                  </MotionButton>
                </motion.div>
              </motion.form>
            </motion.div>

            {/* Contact Info */}
            <motion.div variants={fadeIn}>
              <motion.h3
                className="text-2xl font-bold text-gray-900 mb-6"
                variants={fadeIn}
              >
                Get in Touch
              </motion.h3>
              <motion.div className="space-y-6" variants={staggerContainer}>
                <motion.div
                  className="flex items-start space-x-4"
                  variants={fadeIn}
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 15 }}
                    className="text-primary"
                  >
                    <Phone className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Phone</h4>
                    <p className="text-gray-600">01509 274440</p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start space-x-4"
                  variants={fadeIn}
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 15 }}
                    className="text-primary"
                  >
                    <Mail className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Email</h4>
                    <p className="text-gray-600">info@studentmoves.co.uk</p>
                  </div>
                </motion.div>
                <motion.div className="pt-4" variants={fadeIn}>
                  <h4 className="font-semibold text-lg mb-3">Follow Us</h4>
                  <div className="flex space-x-4">
                    <motion.a
                      href="#"
                      className="text-gray-600 hover:text-primary"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="sr-only">Facebook</span>
                      <Facebook className="h-6 w-6" />
                    </motion.a>
                    <motion.a
                      href="#"
                      className="text-gray-600 hover:text-primary"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="sr-only">Twitter</span>
                      <Twitter className="h-6 w-6" />
                    </motion.a>
                    <motion.a
                      href="https://www.instagram.com/student.moves"
                      className="text-gray-600 hover:text-primary"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="sr-only">Instagram</span>
                      <Instagram className="h-6 w-6" />
                    </motion.a>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <PublicFooter />
    </>
  );
}
