import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, Globe, Target, Zap, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { once: true }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Header */}
      <section className="min-h-[60vh] flex items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-3xl text-center"
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="inline-block mb-6">
            <Sparkles className="w-16 h-16 text-cyan-400" />
          </motion.div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            About NexusVectis
          </h1>
          <p className="text-xl text-slate-300 mb-4">
            Transforming logistics through artificial intelligence and autonomous systems
          </p>
        </motion.div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div {...fadeInUp} className="space-y-4">
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-3xl font-bold mb-3">Our Mission</h2>
                <p className="text-slate-300 text-lg leading-relaxed">
                  To revolutionize global logistics by empowering organizations with AI-driven intelligence that optimizes operations, reduces costs, and minimizes environmental impact. We believe that autonomous, self-learning systems should be accessible to every logistics enterprise.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="space-y-4">
            <div className="flex items-start gap-4">
              <Globe className="w-8 h-8 text-violet-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-3xl font-bold mb-3">Our Vision</h2>
                <p className="text-slate-300 text-lg leading-relaxed">
                  A world where logistics networks operate with perfect efficiency - where AI coordinates millions of vehicles, predicts maintenance before failures occur, and continuously learns to serve humanity better. We're building the operating system for the future of supply chains.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20 px-6 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="space-y-6">
            <h2 className="text-4xl font-bold mb-8">Our Story</h2>
            
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p className="text-lg">
                <strong className="text-cyan-400">NexusVectis</strong> was founded in 2018 by a group of logistics engineers, machine learning researchers, and supply chain visionaries who recognized a critical gap in the market. Traditional TMS (Transportation Management Systems) were static, reactive, and couldn't adapt to real-world complexity.
              </p>

              <p className="text-lg">
                We started as a small team working out of Copenhagen, building predictive maintenance models for truck fleets. Our first breakthrough came when a major European logistics provider deployed our system and saw a 32% reduction in unexpected vehicle downtime. That success proved our concept.
              </p>

              <p className="text-lg">
                Over the next three years, we expanded our AI capabilities to cover demand forecasting, route optimization, and anomaly detection. By 2021, we had processed over 500 million shipments and became the backbone for some of Europe's largest logistics operations. Today, our platform handles real-time coordination of 50,000+ vehicles across 45 countries.
              </p>

              <p className="text-lg">
                What makes us different isn't just our AI - it's our commitment to building systems that learn. Every shipment, every delay, every mechanical issue becomes training data for smarter decisions tomorrow. We're not just solving today's problems; we're architecting intelligence systems that anticipate tomorrow's challenges.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Milestones */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-4xl font-bold mb-12">
            Key Milestones
          </motion.h2>

          <div className="space-y-8">
            {[
              { year: "2018", title: "Founded", desc: "NexusVectis established in Copenhagen with focus on predictive maintenance" },
              { year: "2019", title: "First Major Contract", desc: "European logistics leader deploys our system, achieving 32% reduction in vehicle downtime" },
              { year: "2020", title: "Series A Funding", desc: "Raised €12M to expand to route optimization and demand forecasting" },
              { year: "2021", title: "500M Shipments Milestone", desc: "Platform processes half a billion shipments, enters 15 new markets" },
              { year: "2022", title: "Anomaly Detection & Sustainability", desc: "Launch real-time anomaly detection system and CO₂ tracking for green logistics" },
              { year: "2023", title: "Global Expansion", desc: "Reach 45 countries, coordinate 50,000+ vehicles, achieve €500M ARR" },
              { year: "2024", title: "Intellect Mode Launch", desc: "Deploy advanced AI command orchestration for autonomous decision-making" },
              { year: "2025", title: "Market Leadership", desc: "Become the #1 AI logistics platform in Europe with 250+ enterprise customers" },
            ].map((milestone, idx) => (
              <motion.div
                key={idx}
                {...fadeInUp}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-6 pb-6 border-b border-slate-700/50 last:border-0"
              >
                <div className="flex-shrink-0 w-24">
                  <div className="text-2xl font-bold text-cyan-400">{milestone.year}</div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-slate-400">{milestone.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-6 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-4xl font-bold mb-12 text-center">
            Our Core Values
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Intelligence Driven",
                desc: "We believe in the power of data and AI to solve complex problems. Every decision is informed by evidence, not intuition."
              },
              {
                title: "Customer Obsessed",
                desc: "Your success is our success. We build features based on real logistics challenges, not tech trends."
              },
              {
                title: "Sustainable Impact",
                desc: "Logistics shapes our planet. We're committed to reducing CO₂ emissions and building greener supply chains."
              },
              {
                title: "Continuous Learning",
                desc: "Technology evolves. We stay at the frontier of AI research while keeping systems practical and reliable."
              },
              {
                title: "Transparent & Trustworthy",
                desc: "Your data is your most valuable asset. We protect it with military-grade security and never sell it."
              },
              {
                title: "Global Perspective",
                desc: "Logistics is borderless. We operate in 45 countries and understand the complexity of international supply chains."
              }
            ].map((value, idx) => (
              <motion.div
                key={idx}
                {...fadeInUp}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
              >
                <h3 className="text-xl font-bold mb-3 text-cyan-400">{value.title}</h3>
                <p className="text-slate-300">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeInUp} className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <Users className="w-10 h-10 text-cyan-400" />
              <h2 className="text-4xl font-bold">Our Team</h2>
            </div>
            <p className="text-slate-300 text-lg">
              250+ experts from 35 countries spanning machine learning, logistics, software engineering, and operations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Dr. Henrik Andersen",
                role: "Founder & CEO",
                bio: "PhD in Machine Learning from KTH. 15 years building autonomous systems. Previously at Volvo Autonomous Solutions."
              },
              {
                name: "Sarah Chen",
                role: "CTO",
                bio: "Computer Science from Stanford. Led AI infrastructure at Amazon. Expert in distributed systems and real-time processing."
              },
              {
                name: "Marco Rodriguez",
                role: "VP Operations",
                bio: "15 years in European logistics. Former operations director at Maersk. Deep expertise in supply chain optimization."
              },
              {
                name: "Natalia Volkov",
                role: "Head of AI Research",
                bio: "Published 40+ papers on neural networks. PhD from Moscow State University. Leads our research team."
              },
              {
                name: "James Wilson",
                role: "VP Product",
                bio: "Product leader at Google and Uber. Built products used by 100M+ people. Customer-obsessed innovator."
              },
              {
                name: "Dr. Aisha Patel",
                role: "Sustainability Lead",
                bio: "Environmental scientist and sustainability expert. Masters in Climate Science. Driving our green logistics mission."
              }
            ].map((member, idx) => (
              <motion.div
                key={idx}
                {...fadeInUp}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-violet-400 mb-4" />
                <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                <p className="text-cyan-400 text-sm mb-3">{member.role}</p>
                <p className="text-slate-400 text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "250+", label: "Team Members" },
              { number: "45", label: "Countries Served" },
              { number: "50K+", label: "Vehicles Coordinated" },
              { number: "2B+", label: "Shipments Processed" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                {...fadeInUp}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <p className="text-slate-400 text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-4xl font-bold mb-12">
            What Makes Us Different
          </motion.h2>

          <div className="space-y-6">
            {[
              {
                title: "AI That Actually Learns",
                desc: "Most systems are static. Ours improves every single day with new data. Your system gets smarter, faster, better."
              },
              {
                title: "Built by Logistics People",
                desc: "We're not just AI researchers. Half our team comes from logistics. We understand the real problems you face."
              },
              {
                title: "Real ROI in Months",
                desc: "Average customer sees 30% cost reduction and 47% efficiency gain within 6 months. Not in 2 years."
              },
              {
                title: "Transparency & Control",
                desc: "You own your data. You understand how AI makes decisions. We don't use black boxes."
              },
              {
                title: "Global Scale, Local Support",
                desc: "We operate in 45 countries but treat every customer like they're in our backyard."
              }
            ].map((point, idx) => (
              <motion.div
                key={idx}
                {...fadeInUp}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-4 p-6 rounded-xl bg-gradient-to-r from-cyan-500/5 to-violet-500/5 border border-slate-700/30 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex-shrink-0">
                  <Zap className="w-6 h-6 text-cyan-400 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{point.title}</h3>
                  <p className="text-slate-300">{point.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          {...fadeInUp}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 rounded-2xl p-12"
        >
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Logistics?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join 250+ enterprise customers who are using AI to optimize their supply chains and cut costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 text-white px-8 py-6 text-lg">
              Request Demo <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8 py-6 text-lg">
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer Accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </div>
  );
}