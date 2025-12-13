/**
 * GitHub Service
 * Handles syncing commits from GitHub repository to changelogs
 */

import fetch from "node-fetch";

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
  };
}

interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
  };
}

export interface ParsedCommit {
  sha: string;
  title: string;
  description: string;
  category: "feature" | "bugfix" | "improvement" | "breaking" | "security" | "other";
  author: string;
  date: Date;
  url: string;
  priority: "low" | "medium" | "high";
}

/**
 * Parse commit message to extract title, description, and category
 */
function parseCommitMessage(message: string): {
  title: string;
  description: string;
  category: ParsedCommit["category"];
  priority: ParsedCommit["priority"];
} {
  // Remove merge commits and other noise
  if (message.startsWith("Merge") || message.startsWith("merge")) {
    return {
      title: message.split("\n")[0],
      description: message,
      category: "other",
      priority: "low",
    };
  }

  // Split by newlines
  const lines = message.split("\n").filter((line) => line.trim());
  const firstLine = lines[0] || message;

  // Extract title (first line, up to 100 chars)
  let title = firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;

  // Extract description (remaining lines)
  const description = lines.slice(1).join("\n").trim() || firstLine;

  // Determine category from commit message
  const lowerMessage = message.toLowerCase();
  let category: ParsedCommit["category"] = "other";
  let priority: ParsedCommit["priority"] = "medium";

  if (lowerMessage.includes("feat") || lowerMessage.includes("feature") || lowerMessage.includes("add")) {
    category = "feature";
  } else if (lowerMessage.includes("fix") || lowerMessage.includes("bug")) {
    category = "bugfix";
    priority = "high";
  } else if (lowerMessage.includes("improve") || lowerMessage.includes("refactor") || lowerMessage.includes("optimize")) {
    category = "improvement";
  } else if (lowerMessage.includes("break") || lowerMessage.includes("breaking")) {
    category = "breaking";
    priority = "high";
  } else if (lowerMessage.includes("security") || lowerMessage.includes("sec")) {
    category = "security";
    priority = "high";
  }

  // Check for priority indicators
  if (lowerMessage.includes("[high]") || lowerMessage.includes("urgent") || lowerMessage.includes("critical")) {
    priority = "high";
  } else if (lowerMessage.includes("[low]") || lowerMessage.includes("minor")) {
    priority = "low";
  }

  return { title, description, category, priority };
}

/**
 * Fetch commits from GitHub API
 */
export async function fetchGitHubCommits(
  owner: string,
  repo: string,
  branch: string = "main",
  since?: Date,
  token?: string
): Promise<ParsedCommit[]> {
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
  const params = new URLSearchParams({
    sha: branch,
    per_page: "100",
  });

  if (since) {
    params.append("since", since.toISOString());
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "BetterSystems-CRM",
  };

  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("GitHub authentication failed. Check your token.");
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const commits: GitHubCommitResponse[] = await response.json();

    return commits.map((commit): ParsedCommit => {
      const { title, description, category, priority } = parseCommitMessage(commit.commit.message);

      return {
        sha: commit.sha.substring(0, 7), // Short SHA
        title,
        description,
        category,
        author: commit.author?.login || commit.commit.author.name,
        date: new Date(commit.commit.author.date),
        url: commit.html_url,
        priority,
      };
    });
  } catch (error) {
    console.error("Error fetching GitHub commits:", error);
    throw error;
  }
}

/**
 * Get repository info
 */
export async function getRepositoryInfo(
  owner: string,
  repo: string,
  token?: string
): Promise<{ name: string; description: string; defaultBranch: string; url: string }> {
  const url = `https://api.github.com/repos/${owner}/${repo}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "BetterSystems-CRM",
  };

  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch repository info: ${response.status}`);
    }

    const data = await response.json();

    return {
      name: data.name,
      description: data.description || "",
      defaultBranch: data.default_branch || "main",
      url: data.html_url,
    };
  } catch (error) {
    console.error("Error fetching repository info:", error);
    throw error;
  }
}







