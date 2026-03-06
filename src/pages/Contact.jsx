import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Mail, MessageSquare, Send, Phone, MapPin, Clock, Globe, Linkedin, Twitter } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", company: "", message: "", subject: "general" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await base44.functions.invoke('sendContactMessage', formData);
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", company: "", message: "", subject: "general" });
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        setError(response.data.error || "Failed to send message");
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Link to={createPageUrl("Home")} className="inline-block mb-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis Logo" 
                className="h-24 w-auto mx-auto opacity-90"
              />
            </Link>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8">
              Let's <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Talk</span>
            </h1>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Whether you're interested in a demo, have technical questions, or want to explore enterprise solutions
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="relative py-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: Mail,
                title: "Sales & Demo",
                content: "sales@harborvision.dev",
                desc: "Get a personalized demo and discuss pricing"
              },
              {
                icon: MessageSquare,
                title: "Support",
                content: "support@harborvision.dev",
                desc: "Technical assistance and platform help"
              },
              {
                icon: Phone,
                title: "Enterprise",
                content: "enterprise@harborvision.dev",
                desc: "Custom solutions for large organizations"
              }
            ].map((contact, idx) => {
              const Icon = contact.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all text-center"
                >
                  <Icon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{contact.title}</h3>
                  <a href={`mailto:${contact.content}`} className="text-cyan-400 font-semibold mb-3 block hover:text-cyan-300 transition-colors">
                    {contact.content}
                  </a>
                  <p className="text-slate-400 text-sm">{contact.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-3xl blur-xl" />
              <div className="relative p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
                <h2 className="text-3xl font-bold text-white mb-8">Send us a Message</h2>
                
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                    <p className="text-slate-400">We'll get back to you within 24 hours</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300">
                        {error}
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-semibold mb-2">Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2">Email *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                        placeholder="Your company name"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Subject *</label>
                      <select
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="enterprise">Enterprise Solution</option>
                        <option value="partnership">Partnership</option>
                        <option value="support">Technical Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Message *</label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                        placeholder="Tell us about your logistics challenges..."
                      />
                    </div>

                    <button
                       type="submit"
                       disabled={loading}
                       className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {loading ? (
                         <>
                           Sending...
                         </>
                       ) : (
                         <>
                           Send Message
                           <Send className="w-5 h-5" />
                         </>
                       )}
                     </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div>
                <h2 className="text-3xl font-bold text-white mb-8">Headquarters</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Address</h3>
                      <p className="text-slate-400">
                        H.A.R.B.O.R Vision<br />
                        Vesterbrogade 123<br />
                        1620 København V<br />
                        Denmark<br />
                        VAT: 42662215
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Business Hours</h3>
                      <p className="text-slate-400">
                        Monday - Friday: 9:00 AM - 6:00 PM CET<br />
                        Weekend: Emergency support only
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-fuchsia-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Global Presence</h3>
                      <p className="text-slate-400">
                        Serving 50+ countries<br />
                        24/7 platform availability
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Follow Us</h3>
                <div className="flex gap-4">
                  <a 
                    href="#" 
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Linkedin className="w-5 h-5 text-cyan-400" />
                  </a>
                  <a 
                    href="#" 
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Twitter className="w-5 h-5 text-cyan-400" />
                  </a>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
                <h3 className="text-xl font-bold text-white mb-4">Need Immediate Help?</h3>
                <p className="text-slate-300 mb-6">
                  For urgent technical issues, existing customers can access our priority support portal
                </p>
                <button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                  className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                >
                  Customer Portal
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Quick <span className="text-cyan-400">Answers</span>
            </h2>
            <p className="text-xl text-slate-400">Common questions we receive</p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: "How long does it take to set up NexusVectis?",
                a: "Most customers are up and running within 24 hours. Enterprise deployments with custom integrations typically take 1-2 weeks."
              },
              {
                q: "Do you offer training for our team?",
                a: "Yes! We provide comprehensive onboarding, live training sessions, and ongoing support. FLEET AI is designed to be intuitive—most users are productive within minutes."
              },
              {
                q: "What's included in the pricing?",
                a: "All features including FLEET AI, real-time tracking, analytics, and integrations. Pricing is based on active vehicles and resources, billed monthly."
              },
              {
                q: "Can I integrate with my existing TMS/WMS?",
                a: "Absolutely. We offer pre-built connectors for major platforms plus a comprehensive REST API for custom integrations."
              }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <h4 className="text-lg font-bold text-white mb-3">{faq.q}</h4>
                <p className="text-slate-400 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 px-6 border-t border-white/5 z-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")}>
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                  alt="NexusVectis Logo" 
                  className="h-32 w-auto mb-6 opacity-90"
                />
              </Link>
              <p className="text-slate-400 max-w-md">
                Next-generation fleet intelligence platform powered by AI
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-cyan-400 transition-colors">FLEET AI</Link></li>
                <li><Link to={createPageUrl("HarborInfo")} className="hover:text-amber-400 transition-colors">H.A.R.B.O.R. AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-cyan-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-cyan-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("Newsroom")} className="hover:text-cyan-400 transition-colors">Newsroom</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-cyan-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-cyan-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-cyan-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-8"
          />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Shaping the future of logistics intelligence.</p>
            <div className="flex gap-6 text-slate-400 text-sm">
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
              <Link to={createPageUrl("SecurityPage")} className="hover:text-cyan-400 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}