# Quickstart Guide

## Platform Requirements
- Bash shell (Mac, Linux, Windows WSL or Git Bash)
- Docker Engine 20.10+
- Docker Compose v2.0.0 or newer

## Setup Steps
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd base2
   ```
2. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env to set your values
   ```
3. Build and start all services:
   ```bash
   ./scripts/start.sh --build
   ```
4. View logs:
   ```bash
   ./scripts/logs.sh
   ```
5. Run health checks:
   ```bash
   ./scripts/health.sh
   ```
6. Run tests:
   ```bash
   ./scripts/test.sh
   ```

## Troubleshooting
- Use Bash, not PowerShell or Command Prompt.
- On Windows, use WSL or Git Bash.
- Ensure Docker Compose is v2.0.0 or newer.
- Review error messages for missing files or environment variables.
- See README.md for more details.

## Onboarding
- All required environment variables are documented in `.env.example`.
- Scripts automate all setup, build, start, stop, test, and log processes.
- All major scripts support a `--self-test` mode to verify environment and dependencies before running. Use this mode for troubleshooting and onboarding.
- No manual steps outside documented scripts.

## Support
- For issues, see the troubleshooting section or contact the project maintainer.
