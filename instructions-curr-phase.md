WEEK 1
-------
demo app will be deployed to AWS using SAM (AWS SAM, its an aws service for serverless deployment)

the infrastructure code is inside the template.yaml.

dem0-app will be the app thats gonna be deployed. 

need to add jenkins pipeline and all.

These code might be changed later. still u can use it for this weeks report

WEEK 2
-------
Added code level rule violation checks. Planning to do it with eslint and semgrep. eslint implemented now. semgrep will be implemented later.
the code in app.ts, function codeLevelViolationHandler, makes these violations. there are comments on top of each violation.
eslintrc.js file contains all the violation validation rules.

REMOVE COMMENTS BEFORE SENDING IT TO PROFESSOR. COMMENTS ARE FOR US TO UNDERSTAND.



WEEK 3
-------

pip install checkov

checkov -f template.yml

you can write about the package checkov. and how it detects misconfigurations in IaC.

"Checkov is a static code analysis tool for scanning infrastructure as code (IaC) files for misconfigurations that may lead to security or compliance problems."

This is the output from checkov : output_checkov.txt
Copy some error cases.


WEEK 4
-------

Added Jenkinsfile. It contains code for running the pipeline.