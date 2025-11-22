import React, { useState, useEffect } from "react";
import { FileText, User, Server, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import DashboardLayout, { getNavItems } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTests: 0,
    totalSubmissions: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingIssues: 0,
  });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [userSearchText, setUserSearchText] = useState("");
  const [issueSearchText, setIssueSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch statistics
      const { data: testCount, error: testError } = await supabase
        .from('quizzes')
        .select('id', { count: 'exact' });
      
      const { data: submissionCount, error: submissionError } = await supabase
        .from('submissions')
        .select('id', { count: 'exact' });
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role');
      
      const { data: pendingIssuesCount, error: issuesError } = await supabase
        .from('reports')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');
      
      // Fetch recent tests - explicitly join with profiles to get creator name
      const { data: recentTestsData, error: recentTestsError } = await supabase
        .from('quizzes')
        .select(`
          id, 
          title, 
          created_at,
          created_by,
          profiles!quizzes_created_by_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log("Recent tests data:", recentTestsData);
      console.log("Recent tests error:", recentTestsError);
      
      // Fetch recent users
      const { data: recentUsersData, error: recentUsersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Fetch all issues
      const { data: issuesData, error: allIssuesError } = await supabase
        .from('reports')
        .select(`
          *,
          profiles!reports_reported_by_fkey (name, email)
        `)
        .order('created_at', { ascending: false });
      
      // Fetch all users
      const { data: allUsersData, error: allUsersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesData) {
        const students = profilesData.filter(p => p.role === 'student');
        const teachers = profilesData.filter(p => p.role === 'teacher');
        
        setStats({
          totalTests: testCount?.length || 0,
          totalSubmissions: submissionCount?.length || 0,
          totalUsers: profilesData.length,
          totalStudents: students.length,
          totalTeachers: teachers.length,
          pendingIssues: pendingIssuesCount?.length || 0,
        });
      }
      
      if (recentTestsData) {
        setRecentTests(recentTestsData);
      }
      
      if (recentUsersData) {
        setRecentUsers(recentUsersData);
      }
      
      if (issuesData) {
        setIssues(issuesData);
      }
      
      if (allUsersData) {
        setAllUsers(allUsersData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setIsLoading(false);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setAllUsers(allUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      
      toast.success("User role updated successfully");
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast.error(error.message || "Failed to update user role");
    }
  };

  const handleIssueStatusChange = async (issueId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', issueId);
      
      if (error) throw error;
      
      // Update local state
      setIssues(issues.map(issue => 
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
      
      toast.success(`Issue marked as ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating issue status:", error);
      toast.error(error.message || "Failed to update issue status");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedIssue || !responseText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          admin_response: responseText,
          status: 'addressed',
          responded_at: new Date().toISOString()
        })
        .eq('id', selectedIssue.id);
      
      if (error) throw error;
      
      // Update local state
      setIssues(issues.map(issue => 
        issue.id === selectedIssue.id ? { 
          ...issue, 
          admin_response: responseText,
          status: 'addressed',
          responded_at: new Date().toISOString()
        } : issue
      ));
      
      setResponseDialogOpen(false);
      setResponseText("");
      toast.success("Response sent successfully");
    } catch (error: any) {
      console.error("Error sending response:", error);
      toast.error(error.message || "Failed to send response");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "addressed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchText.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearchText.toLowerCase())
  );

  const filteredIssues = issues.filter(issue => 
    issue.title.toLowerCase().includes(issueSearchText.toLowerCase()) ||
    issue.category.toLowerCase().includes(issueSearchText.toLowerCase()) ||
    issue.status.toLowerCase().includes(issueSearchText.toLowerCase()) ||
    (issue.profiles && issue.profiles.name && issue.profiles.name.toLowerCase().includes(issueSearchText.toLowerCase()))
  );

  const pendingIssues = filteredIssues.filter(issue => issue.status === 'pending');
  const addressedIssues = filteredIssues.filter(issue => issue.status === 'addressed');

  if (!user) return null;

  return (
    <DashboardLayout navItems={getNavItems("admin")}>
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">System overview and management</p>
            </div>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Total Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-3xl font-bold">{stats.totalTests}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-3xl font-bold">{stats.totalSubmissions}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-3xl font-bold">{stats.totalUsers}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {stats.totalStudents} students, {stats.totalTeachers} teachers
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Pending Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                        <span className="text-3xl font-bold">{stats.pendingIssues}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Recent Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Tests</CardTitle>
                      <CardDescription>Latest tests created by teachers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentTests.length > 0 ? (
                          recentTests.map((test) => (
                            <div key={test.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                              <div>
                                <p className="font-medium">{test.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Created by {test.profiles?.name || "Unknown"}
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(test.created_at)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No tests created yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Users</CardTitle>
                      <CardDescription>Latest users who joined the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentUsers.length > 0 ? (
                          recentUsers.map((user) => (
                            <div key={user.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                              <Badge variant={user.role === "teacher" ? "default" : "outline"}>
                                {user.role}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No users yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* System Security */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5 text-primary" />
                      System Status
                    </CardTitle>
                    <CardDescription>
                      Security overview and recent activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-md border p-4">
                          <div className="font-medium mb-1">Pending Issues</div>
                          <div className="text-2xl font-bold">{stats.pendingIssues}</div>
                          <span className="text-xs text-muted-foreground">Waiting for admin response</span>
                        </div>
                        
                        <div className="rounded-md border p-4">
                          <div className="font-medium mb-1">System Status</div>
                          <div className="flex items-center text-2xl text-green-600 font-bold">
                            <CheckCircle className="h-5 w-5 mr-2" /> Online
                          </div>
                          <span className="text-xs text-muted-foreground">All services operational</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all users in the system
                </CardDescription>
                <div className="mt-2">
                  <Input
                    placeholder="Search users by name, email, or role..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Badge variant={user.role === "teacher" ? "default" : user.role === "admin" ? "destructive" : "outline"}>
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button 
                                variant="ghost" 
                                className="text-blue-500 hover:text-blue-700"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogOpen(true);
                                }}
                              >
                                Edit Role
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="issues" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issues Management</CardTitle>
                <CardDescription>
                  Manage and respond to reported issues
                </CardDescription>
                <div className="mt-2">
                  <Input
                    placeholder="Search issues by title, category, or status..."
                    value={issueSearchText}
                    onChange={(e) => setIssueSearchText(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Pending Issues ({pendingIssues.length})</h3>
                  <div className="space-y-4">
                    {pendingIssues.length > 0 ? (
                      pendingIssues.map((issue) => (
                        <div key={issue.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{issue.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                Reported by {issue.profiles?.name} ({issue.reporter_role}) on {formatDate(issue.created_at)}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                              {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                            </div>
                          </div>
                          <p className="text-sm mb-3">{issue.description}</p>
                          <p className="text-xs text-muted-foreground mb-2">Category: {issue.category}</p>
                          
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleIssueStatusChange(issue.id, 'rejected')}
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedIssue(issue);
                                setResponseDialogOpen(true);
                              }}
                            >
                              Respond
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No pending issues</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Addressed Issues ({addressedIssues.length})</h3>
                  <div className="space-y-4">
                    {addressedIssues.length > 0 ? (
                      addressedIssues.map((issue) => (
                        <div key={issue.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{issue.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                Reported by {issue.profiles?.name} ({issue.reporter_role}) on {formatDate(issue.created_at)}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                              {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                            </div>
                          </div>
                          <p className="text-sm mb-3">{issue.description}</p>
                          <p className="text-xs text-muted-foreground mb-2">Category: {issue.category}</p>
                          
                          {issue.admin_response && (
                            <div className="mt-3 border-t pt-3">
                              <p className="text-sm font-medium">Response:</p>
                              <p className="text-sm">{issue.admin_response}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Responded on {formatDate(issue.responded_at || issue.updated_at)}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex justify-end mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleIssueStatusChange(issue.id, 'pending')}
                            >
                              Reopen
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No addressed issues</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {selectedUser && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedUser.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Current Role</p>
                  <Badge variant={selectedUser.role === "teacher" ? "default" : selectedUser.role === "admin" ? "destructive" : "outline"}>
                    {selectedUser.role}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Select New Role</p>
                  <div className="flex space-x-2">
                    <Button 
                      variant={selectedUser.role === "student" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleChangeUserRole(selectedUser.id, "student")}
                      disabled={selectedUser.role === "student"}
                    >
                      Student
                    </Button>
                    <Button 
                      variant={selectedUser.role === "teacher" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleChangeUserRole(selectedUser.id, "teacher")}
                      disabled={selectedUser.role === "teacher"}
                    >
                      Teacher
                    </Button>
                    <Button 
                      variant={selectedUser.role === "admin" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleChangeUserRole(selectedUser.id, "admin")}
                      disabled={selectedUser.role === "admin"}
                    >
                      Admin
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {selectedIssue && (
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Respond to Issue</DialogTitle>
              <DialogDescription>
                Provide a response to the reported issue
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Issue</p>
                  <p className="text-base">{selectedIssue.title}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm">{selectedIssue.description}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="response">Your Response</Label>
                  <Textarea
                    id="response"
                    placeholder="Type your response here..."
                    rows={5}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendResponse} disabled={!responseText.trim()}>
                Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
