# Driftwood GitHub organization

The site repository moved to [driftwood-sh/driftwood](https://github.com/driftwood-sh/driftwood)
on 2026-09-10. History, public visibility, and existing collaborator roles are
preserved. Existing clones continue to work through GitHub redirects; updating
the remote is recommended:

```sh
git remote set-url origin https://github.com/driftwood-sh/driftwood.git
git fetch origin
```

For SSH, use `git@github.com:driftwood-sh/driftwood.git`. No re-clone is necessary.
Do not create a new repo at the old owner/name because that removes redirects.

Vercel still uses the same `driftwood-landing` project in team
`driftwood-d31ce40d`, the `landing` root directory, `main` production branch, and
the existing `driftwood.sh` domain. Its Git connection now uses the new owner.

Related repositories live under the same organization: `driftwood-backend`,
`picoclaw`, `conductor-playground`, and `demo-renderer`. Private-repository access
is granted explicitly; organization membership alone does not grant access.

Administrators can find the full migration and deployment notes in the private
[backend operations guide](https://github.com/driftwood-sh/driftwood-backend/blob/main/docs/github-organization.md).
