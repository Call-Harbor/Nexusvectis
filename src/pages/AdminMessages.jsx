import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, Clock, User, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminMessages() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["contactMessages"],
    queryFn: () => base44.entities.ContactMessage.list("-created_date", 100),
  });

  const markAsRead = async (id) => {
    await base44.entities.ContactMessage.update(id, { status: "read" });
    queryClient.invalidateQueries(["contactMessages"]);
  };

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <AdminLayout currentPage="AdminMessages">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20 border border-violet-500/30">
            <Mail className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Contact Messages</h1>
            <p className="text-slate-400 text-sm">
              {messages.length} total · {newCount} unread
            </p>
          </div>
          {newCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-2">
              {newCount} new
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="text-slate-400 text-center py-20">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-slate-500 text-center py-20">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-5 rounded-xl border transition-all ${
                  msg.status === "new"
                    ? "bg-violet-500/10 border-violet-500/30"
                    : "bg-slate-800/50 border-slate-700/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-white font-semibold text-sm">{msg.name}</span>
                      </div>
                      <span className="text-slate-500 text-sm">{msg.email}</span>
                      {msg.company && (
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Building2 className="w-3 h-3" />
                          {msg.company}
                        </div>
                      )}
                      {msg.subject && (
                        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                          {msg.subject}
                        </Badge>
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>

                    <p className="text-slate-600 text-xs mt-3">
                      {new Date(msg.created_date).toLocaleString("da-DK")}
                    </p>
                  </div>

                  {/* Status / Action */}
                  <div className="flex-shrink-0">
                    {msg.status === "new" ? (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-400/50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark read
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Clock className="w-3 h-3" />
                        {msg.status}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}