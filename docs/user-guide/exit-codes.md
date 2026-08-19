# Exit codes in scripts

Use `exit(0, "complete")` for intentional success and a nonzero code for a decision or failure. A harness can use that result to select rollback, retry, approval, or escalation without scraping prose.

