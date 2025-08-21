import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL, getApiUrl } from "@/config/api";

export default function TestConnection() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint: string, description: string) => {
    try {
      const fullUrl = getApiUrl(endpoint);
      setResults(prev => [...prev, `Testing ${description} at: ${fullUrl}`]);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const status = response.status;
      const data = await response.text();
      
      setResults(prev => [...prev, `✅ ${description}: Status ${status}, Data: ${data.substring(0, 100)}...`]);
      return true;
    } catch (error) {
      setResults(prev => [...prev, `❌ ${description}: ${error}`]);
      return false;
    }
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    
    // Show current configuration
    setResults([
      `Current location: ${window.location.hostname}`,
      `Is Vercel: ${window.location.hostname.includes('vercel.app')}`,
      `API_BASE_URL from env: ${API_BASE_URL || '(not set)'}`,
      `Computed backend URL: ${getApiUrl('/api/test')}`,
      '---Starting API Tests---'
    ]);
    
    // Test endpoints
    await testEndpoint('/api/assessment/questions', 'Assessment Questions');
    await testEndpoint('/api/user/profile', 'User Profile');
    await testEndpoint('/api/flashcards', 'Flashcards');
    await testEndpoint('/api/practice/questions/1', 'Practice Questions');
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/95 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>API Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTests} 
              disabled={loading}
              className="mb-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? 'Testing...' : 'Run Connection Tests'}
            </Button>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
              {results.length === 0 ? (
                <div>Click "Run Connection Tests" to test API endpoints</div>
              ) : (
                results.map((result, i) => (
                  <div key={i} className="mb-1">{result}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}