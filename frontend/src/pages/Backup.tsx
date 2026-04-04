import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Database, AlertCircle } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { Navigate } from "react-router-dom";

const Backup = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/backup/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `backup-${new Date().toISOString().split('T')[0]}.sql`;
      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          fileName = matches[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Database backup started downloading.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download database backup. Please try again later.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Database Management</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your database and backups</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle className="text-base md:text-lg">Database Backup</CardTitle>
            </div>
            <CardDescription>
              Download a complete SQL dump of your database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-3 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Backups contain all your data including products, invoices, and users.
                Keep these files secure.
              </p>
            </div>
            <Button
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Generating Backup..." : "Download Backup"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Backup;

