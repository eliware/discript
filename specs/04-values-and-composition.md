# Values and Command Composition

Discript commands shall return structured values.

Scripts shall be able to assign command results to variables and use those variables as inputs to subsequent commands. The language may also support pipelines for passing one result directly into another operation.

Operation results shall expose success state and an exit code so scripts can branch on failures without immediately terminating. Scripts shall also be able to explicitly terminate with a chosen exit code.
