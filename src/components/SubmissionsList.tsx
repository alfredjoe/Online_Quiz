
import React from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Submission } from "@/types/supabase";

interface SubmissionsListProps {
  submissions: Submission[];
  isLoading: boolean;
}

const SubmissionsList: React.FC<SubmissionsListProps> = ({ submissions, isLoading }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  const calculateDuration = (startTime: string, endTime: string | null) => {
    if (!startTime || !endTime) return "N/A";
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMinutes = Math.round((end - start) / 60000);
    return durationMinutes > 0 ? `${durationMinutes} mins` : "< 1 min";
  };

  const getStudentName = (submission: Submission) => {
    // Check for profiles object format from our separate query approach
    if (submission.profiles && typeof submission.profiles === 'object') {
      if ('name' in submission.profiles && submission.profiles.name) {
        return submission.profiles.name;
      }
    }
    return "Unknown";
  };

  const getStudentEmail = (submission: Submission) => {
    // Check for profiles object format from our separate query approach
    if (submission.profiles && typeof submission.profiles === 'object') {
      if ('email' in submission.profiles && submission.profiles.email) {
        return submission.profiles.email;
      }
    }
    return "No email";
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No submissions yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="hidden md:table-cell">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{getStudentName(submission)}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {getStudentEmail(submission)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={
                  submission.score >= 80 
                    ? "bg-green-100 text-green-800" 
                    : submission.score >= 60 
                    ? "bg-yellow-100 text-yellow-800" 
                    : "bg-red-100 text-red-800"
                }>
                  {submission.score !== null && submission.score !== undefined ? `${submission.score}%` : "0%"}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {formatDate(submission.completed_at || submission.started_at)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {calculateDuration(submission.started_at, submission.completed_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubmissionsList;
