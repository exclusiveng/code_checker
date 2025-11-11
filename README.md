# Code Checker API

## Overview
This is a RESTful API for the Code Checker platform, built with Node.js, Express, and TypeScript. It uses TypeORM for database interaction with PostgreSQL and BullMQ for background job processing for code analysis.

## Features
- **Express**: REST API framework for routing and middleware.
- **TypeORM**: Object-Relational Mapper for interacting with the PostgreSQL database.
- **JWT (RS256)**: Secure, role-based authentication using public/private key pairs.
- **BullMQ & Redis**: Asynchronous job queue for handling resource-intensive code submission analysis.
- **AWS S3**: Scalable object storage for uploaded user code submissions.
- **TypeScript**: Static typing for enhanced code quality and maintainability.
- **Role-Based Access Control (RBAC)**: Differentiated permissions for Super Admins, Admins, Reviewers, and Developers.

## Getting Started
### Installation
1.  **Clone the repository**
    ```bash
    git clone https://github.com/exclusiveng/code_checker.git
    cd code_checker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env` file in the root directory and populate it with the required variables listed below.

4.  **Build the project**
    ```bash
    npm run build
    ```

5.  **Run database migrations**
    ```bash
    npm run migrate
    ```

6.  **Start the server**
    ```bash
    npm run start
    ```
    For development with auto-reloading:
    ```bash
    npm run dev
    ```

### Environment Variables
Create a `.env` file in the project root with the following variables:

| Variable                  | Description                                            | Example                                              |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection URL.                             | `postgres://user:password@localhost:5432/codechecker`  |
| `PORT`                    | Port for the server to listen on.                      | `3000`                                               |
| `JWT_PRIVATE_KEY`         | Inline private key for signing JWTs (RS256).           | `-----BEGIN PRIVATE KEY-----...`                     |
| `JWT_PUBLIC_KEY`          | Inline public key for verifying JWTs (RS256).          | `-----BEGIN PUBLIC KEY-----...`                      |
| `JWT_EXPIRES_IN`          | Token expiration time.                                 | `1d`                                                 |
| `REDIS_URL`               | Connection URL for the Redis server (for BullMQ).      | `redis://127.0.0.1:6379`                             |
| `USE_IN_MEMORY_QUEUE`     | Use an in-memory queue instead of Redis (`1` or `0`).    | `1`                                                  |
| `START_WORKER_WITH_SERVER`| Start the BullMQ worker in the same process (`1` or `0`). | `1`                                                  |
| `GITHUB_TOKEN`            | GitHub personal access token for PR creation.          | `ghp_xxxxxxxxxxxxxxxxxxxx`                           |
| `S3_BUCKET`               | AWS S3 bucket name for file uploads.                   | `code-checker-submissions`                           |
| `AWS_REGION`              | AWS region for the S3 bucket.                          | `us-east-1`                                          |
| `AWS_ACCESS_KEY_ID`       | AWS access key ID.                                     | `AKIAIOSFODNN7EXAMPLE`                               |
| `AWS_SECRET_ACCESS_KEY`   | AWS secret access key.                                 | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`           |
| `SMTP_USER`               | SMTP username for sending emails.                      | `your-email@gmail.com`                               |
| `SMTP_PASS`               | SMTP password or app-specific password.                | `your-app-password`                                  |

## API Documentation
### Base URL
`/api`

### Endpoints
#### **Authentication**
---
#### POST /auth/register
Registers a new user and company. The first user for a company becomes a `SUPER_ADMIN`.
**Request**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "strongPassword123",
  "companyName": "Example Corp"
}
```
**Response**:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "super_admin",
    "companyId": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
    "createdAt": "2023-10-27T10:00:00.000Z"
  }
}
```
**Errors**:
- `400 Bad Request`: Missing required fields or user with this email already exists.

---
#### POST /auth/login
Authenticates a user and returns a JWT.
**Request**:
```json
{
  "email": "john.doe@example.com",
  "password": "strongPassword123"
}
```
**Response**:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "super_admin",
    "companyId": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
    "createdAt": "2023-10-27T10:00:00.000Z"
  }
}
```
**Errors**:
- `400 Bad Request`: Invalid credentials or missing fields.

---
#### GET /auth/me
Retrieves the profile of the currently authenticated user. Requires `Authorization: Bearer <token>` header.
**Request**:
(No payload)
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "super_admin",
    "companyId": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
    "createdAt": "2023-10-27T10:00:00.000Z"
  }
}
```
**Errors**:
- `401 Unauthorized`: No token provided or token is invalid.

#### **Users**
---
#### POST /users
Creates a new user within the authenticated admin's company. (Admin or Super Admin only)
**Request**:
```json
{
  "name": "Jane Developer",
  "email": "jane.dev@example.com",
  "password": "developerPassword456",
  "role": "developer"
}
```
**Response**:
```json
{
  "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
  "name": "Jane Developer",
  "email": "jane.dev@example.com",
  "role": "developer",
  "companyId": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
  "createdAt": "2023-10-27T11:00:00.000Z"
}
```
**Errors**:
- `400 Bad Request`: Missing required fields or email already in use.
- `403 Forbidden`: Insufficient permissions.

---
#### GET /users
Lists all users within the authenticated admin's company. (Admin or Super Admin only)
**Request**:
(No payload)
**Response**:
```json
{
  "users": [
    {
      "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
      "name": "Jane Developer",
      "email": "jane.dev@example.com",
      "role": "developer",
      "companyId": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
      "createdAt": "2023-10-27T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```
**Errors**:
- `403 Forbidden`: Insufficient permissions.

---
#### PUT /users/:id
Updates a user's details. (Admin or Super Admin only)
**Request**:
```json
{
  "name": "Jane Doe",
  "role": "reviewer"
}
```
**Response**:
```json
{
  "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
  "name": "Jane Doe",
  "email": "jane.dev@example.com",
  "role": "reviewer",
  "companyId": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
  "createdAt": "2023-10-27T11:00:00.000Z"
}
```
**Errors**:
- `403 Forbidden`: Insufficient permissions to edit this user.
- `404 Not Found`: User with the specified ID not found.

---
#### DELETE /users/:id
Deletes a user. (Admin or Super Admin only)
**Request**:
(No payload)
**Response**:
`204 No Content`
**Errors**:
- `403 Forbidden`: Insufficient permissions or trying to delete own account.
- `404 Not Found`: User with the specified ID not found.

#### **Projects**
---
#### POST /companies/:companyId/projects
Creates a new project for a company. (Admin or Super Admin only)
**Request**:
```json
{
  "name": "Phoenix Project",
  "repoUrl": "https://github.com/example-corp/phoenix",
  "rulesetIds": ["c3d4e5f6-a7b8-9012-3456-7890abcdef12"]
}
```
**Response**:
```json
{
  "id": "d4e5f6a7-b8c9-0123-4567-890abcdef123",
  "slug": "phoenix-project",
  "companyId": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
  "name": "Phoenix Project",
  "repoUrl": "https://github.com/example-corp/phoenix",
  "createdAt": "2023-10-27T12:00:00.000Z"
}
```
**Errors**:
- `400 Bad Request`: Missing required fields or invalid `rulesetIds`.
- `403 Forbidden`: Not allowed to create a project for another company.

---
#### GET /projects
Lists all projects for the authenticated user's company.
**Request**:
(No payload)
**Response**:
```json
{
  "data": [
    {
      "id": "d4e5f6a7-b8c9-0123-4567-890abcdef123",
      "slug": "phoenix-project",
      "companyId": "f1e2d3c4-b5a6-7890-1234-567890fedcba",
      "name": "Phoenix Project",
      "repoUrl": "https://github.com/example-corp/phoenix",
      "createdAt": "2023-10-27T12:00:00.000Z",
      "rulesets": []
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "last_page": 1
  }
}
```
**Errors**:
- `401 Unauthorized`: Authentication required.

#### **Rulesets**
---
#### POST /rulesets
Creates a new ruleset. (Super Admin only)
**Request**:
```json
{
  "name": "Standard TypeScript Rules",
  "description": "Enforces basic TypeScript project structure and conventions.",
  "projectId": "d4e5f6a7-b8c9-0123-4567-890abcdef123",
  "rules": [
    {
      "type": "filepattern",
      "payload": { "require": ["tsconfig.json"] },
      "severity": "error",
      "message": "tsconfig.json is missing."
    },
    {
      "type": "content",
      "payload": { "banned": ["console\\.log"] },
      "severity": "warning",
      "message": "Found console.log statement."
    }
  ]
}
```
**Response**:
(The newly created ruleset object)
**Errors**:
- `400 Bad Request`: Invalid `rules` structure or missing fields.

---
#### GET /rulesets
Lists all rulesets for the company. (Admin or Super Admin only)
**Request**:
(No payload)
**Response**:
(An array of ruleset objects)
**Errors**:
- `401 Unauthorized`: Authentication required.

---
#### GET /rulesets/:id
Retrieves a single ruleset by its ID. (Admin or Super Admin only)
**Request**:
(No payload)
**Response**:
(A single ruleset object with its associated rules)
**Errors**:
- `404 Not Found`: Ruleset not found.

---
#### PUT /rulesets/:id
Updates an existing ruleset. (Super Admin only)
**Request**:
```json
{
  "name": "Updated TypeScript Rules",
  "rules": [
    {
      "type": "filepattern",
      "payload": { "require": ["tsconfig.json", "README.md"] },
      "severity": "error",
      "message": "tsconfig.json or README.md is missing."
    }
  ]
}
```
**Response**:
(The updated ruleset object)
**Errors**:
- `400 Bad Request`: Invalid `rules` structure.
- `404 Not Found`: Ruleset not found.

---
#### DELETE /rulesets/:id
Deletes a ruleset. (Super Admin only)
**Request**:
(No payload)
**Response**:
`204 No Content`
**Errors**:
- `404 Not Found`: Ruleset not found.

#### **Submissions**
---
#### POST /submissions/upload
Uploads a `.zip` file for analysis. This is a `multipart/form-data` endpoint.
**Request**:
- Field `submissionFile`: The `.zip` file.
- Field `projectId`: The UUID of the project.
**Response**:
```json
{
  "message": "File uploaded successfully, analysis queued.",
  "submission": {
    "id": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
    "developerId": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "projectId": "d4e5f6a7-b8c9-0123-4567-890abcdef123",
    "zipUrl": "https://s3.amazonaws.com/bucket/path/to/file.zip",
    "status": "pending",
    "createdAt": "2023-10-27T13:00:00.000Z"
  }
}
```
**Errors**:
- `400 Bad Request`: No file uploaded, `projectId` missing, or project has no rulesets.

---
#### GET /submissions
Lists submissions for the authenticated developer.
**Request**:
(No payload)
**Response**:
Paginated list of submission objects.

---
#### GET /submissions/:id/status
Retrieves the status and results of a specific submission.
**Request**:
(No payload)
**Response**:
```json
{
  "id": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
  "status": "failed",
  "results": {
    "findings": [
      {
        "ruleId": "system-error",
        "severity": "error",
        "message": "No ruleset is configured for this project.",
        "locations": []
      }
    ]
  },
  "project": { ... },
  "createdAt": "2023-10-27T13:00:00.000Z"
}
```
**Errors**:
- `404 Not Found`: Submission not found.
- `403 Forbidden`: Insufficient permissions to view this submission.

---
#### POST /submissions/:id/push
Pushes an approved submission to its configured GitHub repository as a new pull request. (Admin or Super Admin only)
**Request**:
(No payload)
**Response**:
```json
{
  "message": "Pull request created",
  "prUrl": "https://github.com/example-corp/phoenix/pull/123"
}
```
**Errors**:
- `400 Bad Request`: Submission is not approved, GitHub token not configured, or push failed.

#### **Reviews**
---
#### POST /submissions/:submissionId/reviews
Creates a review for a submission. (Reviewer, Admin, or Super Admin only)
**Request**:
```json
{
  "comments": "Looks good, but please update the documentation.",
  "approved": true
}
```
**Response**:
(The newly created review object)
**Errors**:
- `400 Bad Request`: Submission not found or missing fields.

---
#### GET /submissions/:submissionId/reviews
Lists all reviews for a submission.
**Request**:
(No payload)
**Response**:
(An array of review objects for the submission)
**Errors**:
- `401 Unauthorized`: Authentication required.