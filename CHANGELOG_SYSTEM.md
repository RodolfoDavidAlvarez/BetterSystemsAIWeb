# Changelog System Documentation

## Overview

The Changelog System is a comprehensive solution for tracking changes, syncing with GitHub, and automatically populating client updates. It provides a clean interface to manage changelogs and seamlessly integrate them into project updates.

## Features

### 1. **Changelog Management**

- Create, edit, and delete changelogs manually
- Categorize changes (feature, bugfix, improvement, breaking, security, other)
- Set priority levels (low, medium, high)
- Mark changelogs as public/private
- Link changelogs to specific projects

### 2. **GitHub Integration**

- Sync commits from GitHub repositories automatically
- Parse commit messages to extract categories and priorities
- Track which commits have been synced (prevents duplicates)
- Support for private repositories with GitHub tokens

### 3. **Client Updates Integration**

- Select changelogs when creating project updates
- Automatically populate update content from selected changelogs
- Streamline the process of sending updates to clients

### 4. **Hideable Sidebar Tab**

- Changelogs tab can be hidden/shown via toggle in sidebar footer
- Preference is saved in localStorage
- Hidden by default for a cleaner interface

## Database Schema

The system adds a new `changelogs` table with the following structure:

- **id**: Primary key
- **title**: Change title
- **description**: Detailed description (markdown supported)
- **category**: feature, bugfix, improvement, breaking, security, other
- **priority**: low, medium, high
- **status**: draft, published, archived
- **isPublic**: Boolean - can be included in client updates
- **isFromGitHub**: Boolean - indicates if synced from GitHub
- **githubCommitSha**: Short SHA of the commit
- **githubCommitUrl**: URL to the commit on GitHub
- **githubAuthor**: Commit author
- **githubDate**: Commit date
- **relatedProjectId**: Optional link to a project
- **tags**: Array of tags
- **createdBy**: User who created the changelog
- **createdAt**, **updatedAt**: Timestamps

## API Endpoints

### Changelog Management

- `GET /api/admin/changelogs` - List all changelogs (with filters)
- `GET /api/admin/changelogs/:id` - Get specific changelog
- `POST /api/admin/changelogs` - Create new changelog
- `PUT /api/admin/changelogs/:id` - Update changelog
- `DELETE /api/admin/changelogs/:id` - Delete changelog

### GitHub Sync

- `POST /api/admin/changelogs/sync/github` - Sync commits from GitHub
  - Body: `{ owner, repo, branch, since?, token? }`
- `GET /api/admin/changelogs/github/repo` - Get repository info
  - Query: `owner`, `repo`, `token?`

### Public Changelogs

- `GET /api/admin/changelogs/public` - Get public changelogs for client updates
  - Query: `projectId?`, `limit?`

## Usage Guide

### Setting Up GitHub Sync

1. **Navigate to Changelogs Page**

   - Click "Show Changelogs" in the sidebar footer (if hidden)
   - Or go to `/admin/changelogs`

2. **Sync from GitHub**

   - Click "Sync from GitHub" button
   - Enter repository details:
     - **Owner**: `RodolfoDavidAlvarez` (or your GitHub username)
     - **Repository**: `Fleet` (or your repo name)
     - **Branch**: `main` (default)
     - **Since Date**: Optional - only sync commits after this date
     - **GitHub Token**: Optional - required for private repos or higher rate limits
   - Click "Sync"

3. **Review Synced Changelogs**
   - All synced commits appear as draft changelogs
   - Edit them to set status, priority, or add details
   - Mark as "published" to make them available for client updates

### Creating Manual Changelogs

1. Click "New Changelog" button
2. Fill in the form:
   - **Title**: Brief description of the change
   - **Description**: Detailed explanation (supports markdown)
   - **Category**: Select appropriate category
   - **Priority**: Set priority level
   - **Status**: Draft, Published, or Archived
   - **Public**: Check to allow inclusion in client updates
3. Click "Create"

### Using Changelogs in Project Updates

1. **Navigate to a Project**

   - Go to Projects page
   - Click on a project to view details

2. **Create Update with Changelogs**

   - Click "Add Update" button
   - In the "Include Changelogs" section, select changelogs you want to include
   - The form will automatically populate with:
     - **Title**: Single changelog title, or "Project Updates" for multiple
     - **Content**: Combined descriptions of selected changelogs
   - Review and edit the content as needed
   - Fill in other fields (Type, Visibility)
   - Click "Create Update"

3. **Send to Client**
   - After creating the update, click "Send" to email it to the client
   - The update will be marked as sent

### Hiding/Showing Changelogs Tab

1. Scroll to the bottom of the sidebar
2. Click "Hide Changelogs" or "Show Changelogs" button
3. The preference is saved automatically
4. If you're on the changelogs page when hiding, you'll be redirected to dashboard

## GitHub Commit Message Parsing

The system automatically categorizes commits based on message content:

- **Feature**: Contains "feat", "feature", or "add"
- **Bugfix**: Contains "fix" or "bug"
- **Improvement**: Contains "improve", "refactor", or "optimize"
- **Breaking**: Contains "break" or "breaking"
- **Security**: Contains "security" or "sec"
- **Other**: Default category

Priority detection:

- **High**: Contains "[high]", "urgent", or "critical"
- **Low**: Contains "[low]" or "minor"
- **Medium**: Default

## Environment Variables

Optional environment variable for GitHub integration:

```env
GITHUB_TOKEN=your_github_personal_access_token
```

This is used as a fallback if no token is provided in the sync form. Useful for:

- Private repositories
- Higher API rate limits
- Automated syncing

## Best Practices

1. **Regular Syncing**: Sync from GitHub regularly to keep changelogs up-to-date
2. **Review Before Publishing**: Always review synced changelogs before marking as published
3. **Link to Projects**: Link relevant changelogs to projects for better organization
4. **Use Tags**: Add tags to changelogs for better filtering and organization
5. **Combine Related Changes**: When creating updates, select multiple related changelogs
6. **Edit Auto-Populated Content**: Always review and refine auto-populated content before sending

## Troubleshooting

### GitHub Sync Fails

- Check repository name and owner are correct
- Verify branch name exists
- For private repos, ensure GitHub token is provided
- Check network connectivity

### Changelogs Not Appearing in Updates

- Ensure changelogs are marked as "Public"
- Check status is "Published"
- Verify you're on the correct project page

### Duplicate Changelogs

- The system prevents duplicates by checking commit SHAs
- If you see duplicates, they may be from different branches or repositories

## Future Enhancements

Potential improvements:

- Automatic syncing on schedule (cron job)
- Webhook integration for real-time sync
- Changelog templates
- Export changelogs to various formats
- Integration with release notes
- Client-facing changelog page












