import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UserPlus, Users, Mail, Shield, User, Trash2, Search, Calendar, Activity, Download, Filter, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import moment from "moment";

export default function UserManagement() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const queryClient = useQueryClient();

  // Get current user
  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await base44.auth.me();
      console.log('Current user:', user);
      console.log('User org_id from currentUser:', user?.organization_id || user?.data?.organization_id);
      setCurrentUser(user);
      return user;
    },
    staleTime: 0, // Always refetch
  });

  // Get organization
  const { data: organization } = useQuery({
    queryKey: ['organization', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0] || null;
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  // List organization members
  const { data: members = [] } = useQuery({
    queryKey: ['orgMembers', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];

      const orgMembers = await base44.entities.OrganizationMember.filter({ organization_id: orgId });
      return orgMembers;
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
    staleTime: 0,
  });

  // List users from same organization
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', members],
    queryFn: async () => {
      if (members.length === 0) return [currentUser] || [];

      const allUsers = await base44.entities.User.list();

      // Get active members' user data
      const activeMembers = members.filter(m => m.status !== 'removed');
      const memberEmails = activeMembers.map(m => m.user_email);

      const filteredUsers = allUsers.filter(u => memberEmails.includes(u.email));

      // Always ensure current user is in the list
      if (!filteredUsers.find(u => u.id === currentUser?.id) && currentUser) {
        return [currentUser, ...filteredUsers];
      }

      return filteredUsers || [];
    },
    enabled: !!currentUser,
    staleTime: 0,
  });

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;

      // Invite user globally (creates user account if doesn't exist)
      // Use 'admin' role if inviting an admin, otherwise 'user'
      await base44.users.inviteUser(email, role === 'admin' ? 'admin' : 'user');

      // Create organization member record with specific role (only if org exists)
      if (orgId) {
        await base44.entities.OrganizationMember.create({
          organization_id: orgId,
          user_email: email,
          role: role,
          status: 'invited'
        });
      }

      // Log security audit
      await base44.functions.invoke('auditLog', {
        action: 'user_invited',
        resource_type: 'user',
        resource_id: email,
        status: 'success',
        details: `Invited user with role: ${role}${orgId ? ` to organization ${orgId}` : ''}`,
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

    // Only platform admins can invite other admins
    if (inviteRole === "admin" && currentUser?.role !== 'admin') {
      toast.error("Only admins can invite other admins");
      return;
    }

    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  // Determine admin based on OrganizationMember role
  const usersWithOrgs = users.map(user => {
    const memberRecord = members.find(m => m.user_email === user.email);
    return {
      ...user,
      isAdmin: memberRecord?.role === 'admin',
      memberStatus: memberRecord?.status || 'active'
    };
  });

  // Filter users
  const filteredUsers = usersWithOrgs.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === "all" ||
      (roleFilter === "admin" && user.isAdmin) ||
      (roleFilter === "user" && !user.isAdmin);
    
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    if (sortBy === "name") return (a.full_name || "").localeCompare(b.full_name || "");
    if (sortBy === "email") return (a.email || "").localeCompare(b.email || "");
    if (sortBy === "date") return new Date(b.created_date) - new Date(a.created_date);
    return 0;
  });

  const adminUsers = filteredUsers.filter(u => u.isAdmin);
  const regularUsers = filteredUsers.filter(u => !u.isAdmin);

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Role", "Joined Date"];
    const rows = filteredUsers.map(u => [
      u.full_name || "-",
      u.email || "-",
      u.isAdmin ? "Admin" : "User",
      u.created_date ? moment(u.created_date).format('DD-MM-YYYY') : "-"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
            <p className="text-slate-400 mt-1">
              {filteredUsers.length} of {users.length} users
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={exportToCSV}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowInviteDialog(true)}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-semibold"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              {["all", "admin", "user"].map((role) => (
                <Button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  variant={roleFilter === role ? "default" : "outline"}
                  className={roleFilter === role ? "bg-cyan-600" : "border-slate-700 text-slate-300"}
                  size="sm"
                >
                  {role === "all" ? "All Users" : role === "admin" ? "Admins" : "Users"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Sort by:</label>
              <div className="flex gap-2">
                {[
                  { value: "name", label: "Name" },
                  { value: "email", label: "Email" },
                  { value: "date", label: "Join Date" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    variant={sortBy === option.value ? "default" : "outline"}
                    size="sm"
                    className={sortBy === option.value ? "bg-emerald-600" : "border-slate-700 text-slate-300"}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {(searchTerm || roleFilter !== "all") && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">Active filters:</span>
                {searchTerm && (
                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    Search: {searchTerm}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setSearchTerm("")}
                    />
                  </Badge>
                )}
                {roleFilter !== "all" && (
                  <Badge variant="outline" className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                    Role: {roleFilter}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setRoleFilter("all")}
                    />
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                  }}
                  className="text-slate-500 hover:text-white text-xs ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
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
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-violet-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-full bg-violet-500/20">
                        <Shield className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {user.created_date && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {moment(user.created_date).format('MMM DD, YYYY')}
                            </p>
                          )}
                          {user.memberStatus === 'invited' && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">⏳ Invitation pending</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">Admin</Badge>
                      <span className="text-[10px] text-slate-500">Full access</span>
                    </div>
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
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      user.memberStatus === 'invited'
                        ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                        : 'bg-slate-900/50 border-slate-700/30 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-full ${user.memberStatus === 'invited' ? 'bg-amber-500/15' : 'bg-cyan-500/20'}`}>
                        <User className={`w-4 h-4 ${user.memberStatus === 'invited' ? 'text-amber-400' : 'text-cyan-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {user.created_date && user.memberStatus !== 'invited' && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {moment(user.created_date).format('MMM DD, YYYY')}
                            </p>
                          )}
                          {user.memberStatus === 'invited' && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">⏳ Invitation sent — not yet accepted</Badge>
                          )}
                          {user.memberStatus === 'active' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">✓ Active member</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">User</Badge>
                      <span className="text-[10px] text-slate-500">Limited access</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {filteredUsers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">{searchTerm || roleFilter !== "all" ? "No users match your search" : "No users yet"}</p>
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
                  ? "Admins have full access to all features within your organization and can invite other users."
                  : "Users have access to your organization's data but cannot manage settings or invite others."}
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