import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UserPlus, Users, Mail, Shield, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function UserManagement() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  // Get current user
  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      return user;
    },
    staleTime: 0, // Always refetch
  });

  // Get organization
  const { data: organization } = useQuery({
    queryKey: ['organization', currentUser?.organization_id],
    queryFn: async () => {
      if (!currentUser?.organization_id) return null;
      const orgs = await base44.entities.Organization.filter({ id: currentUser.organization_id });
      return orgs[0] || null;
    },
    enabled: !!currentUser?.organization_id,
  });

  // List users from same organization
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', currentUser?.organization_id],
    queryFn: async () => {
      if (!currentUser?.organization_id) return [];
      const allUsers = await base44.entities.User.list();
      const filteredUsers = allUsers.filter(u => u.organization_id === currentUser?.organization_id);
      
      // Ensure current user is included
      const currentUserInList = filteredUsers.find(u => u.id === currentUser.id);
      if (!currentUserInList) {
        return [currentUser, ...filteredUsers];
      }
      
      return filteredUsers;
    },
    enabled: !!currentUser?.organization_id,
    staleTime: 0,
  });

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      // Invite user
      await base44.users.inviteUser(email, role);
      
      // Set organization_id for invited user (will be set when they accept)
      // Note: The invited user will need to be assigned to organization on first login
      
      // Log security audit
      await base44.functions.invoke('auditLog', {
        action: 'user_invited',
        resource_type: 'user',
        resource_id: email,
        status: 'success',
        details: `Invited user with role: ${role} to organization ${currentUser?.organization_id}`,
        severity: 'medium'
      }).catch(() => {}); // Don't fail if audit log fails
    },
    onSuccess: () => {
      toast.success("Invitation sent!");
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("user");
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
      
      // Log failed attempt
      base44.functions.invoke('auditLog', {
        action: 'user_invite_failed',
        resource_type: 'user',
        resource_id: inviteEmail,
        status: 'failed',
        details: error.message,
        severity: 'high'
      }).catch(() => {});
    },
  });

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Only org admins can invite other admins
    const isOrgAdmin = currentUser?.email === organization?.admin_email;
    if (inviteRole === "admin" && !isOrgAdmin) {
      toast.error("Only admins can invite other admins");
      return;
    }

    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  // Determine admin based on their own organization's admin_email
  const usersWithOrgs = users.map(user => ({
    ...user,
    isAdmin: user.organization_id ? (
      // For users in the same org, check against the shared org's admin_email
      organization?.id === user.organization_id && user.email === organization?.admin_email
    ) : false
  }));

  const adminUsers = usersWithOrgs.filter(u => u.isAdmin);
  const regularUsers = usersWithOrgs.filter(u => !u.isAdmin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-slate-400 mt-1">{users.length} users in your organization</p>
          </div>
          <Button 
            onClick={() => setShowInviteDialog(true)}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-cyan-500/20">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-slate-500">Total Users</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-violet-500/20">
                <Shield className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{adminUsers.length}</p>
                <p className="text-sm text-slate-500">Admins</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/20">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{regularUsers.length}</p>
                <p className="text-sm text-slate-500">Regular Users</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {/* Admins */}
          {adminUsers.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-400" />
                  Administrators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {adminUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <Shield className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                      Admin
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Regular Users */}
          {regularUsers.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {regularUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-cyan-500/20">
                        <User className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                      User
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {users.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No users yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Invite User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-slate-800 border-slate-700 pl-10"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  {currentUser?.email === organization?.admin_email && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-2">
                {inviteRole === "admin" 
                  ? "Admins have full access to all features and can invite other users."
                  : "Regular users have limited access to the platform."}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-sm text-cyan-300">
                An invitation email will be sent to the user with instructions to join your organization.
              </p>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold"
              onClick={handleInvite}
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}