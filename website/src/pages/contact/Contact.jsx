import ContactForm from "../../components/contactForm/ContactForm";
import Seo from "../../components/Seo";
import "./Contact.scss";

export default function Contact() {
  return (
    <div className="contact-page">
      <Seo
        titleKey="seo.contact_title"
        descriptionKey="seo.contact_description"
      />
      <ContactForm />
    </div>
  );
}
