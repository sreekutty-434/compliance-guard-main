# CI/CD Compliance Pipeline Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Design](#architecture--design)
3. [Code-Level Compliance Framework](#code-level-compliance-framework)
4. [Infrastructure-Level Compliance Framework](#infrastructure-level-compliance-framework)
5. [Pipeline Implementation](#pipeline-implementation)
6. [Violation Detection Mechanisms](#violation-detection-mechanisms)
7. [Regulatory Compliance Mapping](#regulatory-compliance-mapping)
8. [Environment Setup & Configuration](#environment-setup--configuration)
9. [Deployment Strategy](#deployment-strategy)
10. [Monitoring & Reporting](#monitoring--reporting)

## System Overview

This CI/CD pipeline implements a comprehensive compliance checking system that validates both application code and infrastructure configurations against multiple regulatory standards including HIPAA, GDPR, PCI-DSS, SOC 2, and OWASP Top 10 before allowing deployment to production.

### Core Objectives
- **Preventive Security**: Block non-compliant code from reaching production
- **Regulatory Adherence**: Ensure compliance with healthcare, financial, and data protection regulations
- **Automated Validation**: Eliminate manual security reviews through automated scanning
- **Developer Feedback**: Provide immediate feedback on compliance violations during development

### System Components
- **Jenkins Pipeline**: Orchestrates the entire compliance workflow
- **ESLint + Security Plugins**: Performs static code analysis for security vulnerabilities
- **Checkov**: Validates infrastructure-as-code against security best practices
- **AWS SAM**: Manages serverless application deployment with built-in security controls

## Architecture & Design

### Application Structure
The system maintains two parallel applications for demonstration and validation:

```
├── vulnerable-app/          # Contains intentional violations for testing
│   ├── app.ts              # Vulnerable Lambda handlers
│   ├── template.yaml       # Non-compliant infrastructure
│   └── .eslintrc.js        # Strict security rules
└── secure-app/             # Follows compliance best practices
    ├── app.ts              # Secure implementation
    ├── template.yaml       # Compliant infrastructure
    └── .checkov.yaml       # Custom compliance configuration
```

### Pipeline Flow
1. **Source Checkout**: Retrieves latest code from version control
2. **Dependency Resolution**: Installs compliance scanning tools
3. **Parallel Compliance Validation**: Simultaneous code and infrastructure checks
4. **Conditional Deployment**: Proceeds only if all compliance checks pass
5. **Post-Deployment Validation**: Confirms successful deployment

## Code-Level Compliance Framework

### ESLint Security Configuration

The code-level compliance system uses ESLint with specialized security plugins to detect 8 categories of vulnerabilities:

#### Core Security Plugins
```javascript
plugins: ['security', 'no-secrets']
```

The `security` plugin detects common security antipatterns, while `no-secrets` specifically identifies hardcoded credentials and sensitive data.

#### Input Validation Detection
```javascript
rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error'
}
```

These rules catch unsafe dynamic property access and module loading patterns that could lead to code injection vulnerabilities.

#### SQL Injection Prevention
```javascript
'no-restricted-syntax': [
    'error',
    {
        selector: 'TemplateLiteral[expressions.length>0] CallExpression[callee.property.name="execute"]',
        message: 'Potential SQL injection: Template literals with expressions in SQL queries are dangerous'
    }
]
```

This AST-based rule specifically targets template literal usage in database query execution, catching patterns like:
```typescript
// VIOLATION DETECTED
const query = `SELECT * FROM users WHERE id = ${userId}`;
await connection.execute(query);
```

#### Hardcoded Secrets Detection
```javascript
'no-secrets/no-secrets': [
    'error',
    {
        tolerance: 4.2,
        additionalRegexes: {
            'Hardcoded Password': 'password\\s*[:=]\\s*["\'][^"\']{3,}["\']',
            'API Key': '(api[_-]?key|apikey)\\s*[:=]\\s*["\'][^"\']{10,}["\']'
        }
    }
]
```

The system uses entropy analysis combined with regex patterns to identify potential secrets in source code.

#### Information Exposure Prevention
```javascript
{
    selector: 'Property[key.name="stack"]',
    message: 'Exposing stack traces can leak sensitive information'
},
{
    selector: 'Property[key.name=/env|systemInfo|nodeVersion|platform/]',
    message: 'Exposing system information can aid attackers'
}
```

These rules prevent accidental exposure of system internals through API responses.

### Vulnerable Code Examples

#### SQL Injection Vulnerability
```typescript
// VIOLATION: String concatenation in SQL queries
const vulnerableQuery = `SELECT * FROM users WHERE name = '${userInput}' AND id = ${userId}`;
const [rows] = await connection.execute(vulnerableQuery);
```

#### Hardcoded Credentials
```typescript
// VIOLATION: Database credentials in source code
const connection = await mysql.createConnection({
    password: 'admin123', // Detected by entropy + regex analysis
    database: 'testdb'
});
```

#### Information Leakage
```typescript
// VIOLATION: Exposing environment variables
return {
    body: JSON.stringify({
        env: process.env, // All environment variables exposed
        stack: error.stack // Stack trace in response
    })
};
```

### Secure Implementation Patterns

#### Secure Environment Handling
```typescript
const getEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing env var: ${key}`);
    }
    return value;
};
```

#### Secure AWS Operations
```typescript
const result = await s3.send(
    new PutObjectCommand({
        Bucket: getEnv('BUCKET_NAME'),
        ServerSideEncryption: 'AES256', // Encryption enforced
        Body: JSON.stringify({ event })
    })
);
```

## Infrastructure-Level Compliance Framework

### Checkov Integration

Checkov analyzes CloudFormation templates using a comprehensive rule set covering AWS security best practices:

#### Basic Checkov Execution
```bash
# strict checking
checkov -f template.yaml
```


### Infrastructure Violations

#### Excessive IAM Permissions
```yaml
# VIOLATION: Overly broad permissions
BadIAMLambda:
  Type: AWS::Serverless::Function
  Properties:
    Policies:
      - Statement:
          - Effect: Allow
            Action: "*"      # Violates least privilege principle
            Resource: "*"
    Environment:
      Variables:
        SSN: "123-45-6789"          # PII in environment variables
        EMAIL: "patient@example.com" # More PII exposure
        PASSWORD: "hardcoded123"     # Hardcoded secret in env vars
```

**Compliance Impact**: Violates HIPAA minimum necessary standard, SOC 2 access controls, and GDPR data protection requirements.

#### Public Data Storage
```yaml
# VIOLATION: Publicly accessible S3 bucket
PublicS3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    PublicAccessBlockConfiguration:
      BlockPublicAcls: false          # Allows public ACLs
      RestrictPublicBuckets: false    # Permits public bucket policies
```

**Compliance Impact**: Violates HIPAA safeguards, GDPR data protection, and PCI-DSS access controls.

#### Unencrypted Storage
```yaml
# VIOLATION: No encryption configuration
UnencryptedS3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub "unencrypted-demo-bucket-${AWS::AccountId}"
    # Missing: BucketEncryption configuration
```

**Compliance Impact**: Violates HIPAA encryption requirements and PCI-DSS data protection.

#### Network Security Violations
```yaml
# VIOLATION: Overly permissive security group rules
OverlyPermissiveSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        CidrIp: 0.0.0.0/0      # SSH open to entire internet
      - IpProtocol: tcp
        FromPort: 3306
        ToPort: 3306
        CidrIp: 0.0.0.0/0      # MySQL port open to entire internet
      - IpProtocol: -1
        CidrIp: 0.0.0.0/0      # All protocols/ports open to internet
```

**Compliance Impact**: Violates HIPAA network security requirements, GDPR security measures, and PCI-DSS network access controls.

#### Missing Audit Controls
```yaml
# VIOLATION: API without access logging
ApiWithoutLogging:
  Type: AWS::Serverless::Api
  Properties:
    StageName: prod
    # Missing: AccessLogSetting configuration
```

**Compliance Impact**: Violates HIPAA audit controls (§164.312(b)) and SOC 2 monitoring requirements.

### Secure Infrastructure Patterns

#### Properly Configured S3 Bucket
```yaml
SecureBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    VersioningConfiguration:
      Status: Enabled
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
```

#### Properly Configured Lambda Function
```yaml
SecureLambda:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: app.secureHandler
      Environment:
        Variables:
          BUCKET_NAME: !Ref SecureBucket
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /secure
            Method: get
    Metadata:
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        Sourcemap: false
        TreeShaking: true
        External:
          - aws-sdk
        Bundle: true
        Format: cjs
```

## Pipeline Implementation

### Jenkins Pipeline Architecture

The Jenkins pipeline uses a parameterized approach allowing selective deployment of either vulnerable or secure applications:

```groovy
parameters {
    choice(name: 'APP_NAME', choices: ['vulnerable-app', 'secure-app'], 
           description: 'Select app to deploy')
}
```

### Conditional Tool Installation

The pipeline intelligently installs required tools only if they're not already present:

```groovy
sh '''
    if ! command -v checkov &> /dev/null; then
        pip3 install --user checkov
    fi
    if ! command -v sam &> /dev/null; then
        pip3 install aws-sam-cli
    fi
'''
```

### Parallel Compliance Execution

The pipeline executes code and infrastructure checks simultaneously for faster feedback:

```groovy
stage('Run compliance checks in parallel') {
    parallel {
        stage('Code level checks') {
            steps {
                script {
                    try {
                        sh 'npm run lint'
                    } catch (err) {
                        currentBuild.result = 'FAILURE'
                        throw err
                    }
                }
            }
        }
        stage('Infra level checks') {
            steps {
                script {
                    def command = params.APP_NAME == 'secure-app' ?
                        'checkov -f template.yaml --config-file .checkov.yaml' :
                        'checkov -f template.yaml'
                    sh command
                }
            }
        }
    }
}
```

### Deployment Gate

Deployment only proceeds if all compliance checks pass:

```groovy
stage('SAM deploy') {
    steps {
        withAWS(credentials: 'aws-creds', region: 'eu-west-1') {
            sh 'sam build'
            sh 'sam deploy --no-confirm-changeset --capabilities CAPABILITY_IAM'
        }
    }
}
```

## Violation Detection Mechanisms

### Static Code Analysis

ESLint performs multiple passes through the codebase:

1. **Lexical Analysis**: Identifies tokens and basic syntax patterns
2. **AST Parsing**: Builds abstract syntax tree for complex pattern matching
3. **Rule Evaluation**: Applies security rules against AST nodes
4. **Violation Reporting**: Generates detailed reports with line numbers and remediation guidance

### Infrastructure Configuration Analysis

Checkov uses policy-as-code approach:

1. **Template Parsing**: Analyzes CloudFormation/Terraform syntax
2. **Resource Mapping**: Identifies AWS resource configurations
3. **Policy Evaluation**: Applies CIS benchmarks and security policies
4. **Compliance Scoring**: Generates pass/fail status for each check

### Real-time Feedback Loop

```bash
# Example violation output
ERROR: Potential SQL injection detected
File: app.ts, Line: 23
Rule: no-restricted-syntax
Message: Template literals with expressions in SQL queries are dangerous
```

## Regulatory Compliance Mapping

### Comprehensive Violation-to-Standard Mapping

| Violation Category | Specific Issue | HIPAA | GDPR | PCI-DSS | SOC 2 | OWASP |
|-------------------|----------------|-------|------|---------|-------|-------|
| **Input Validation** | Unvalidated user input | ✓ §164.312(c)(1) | ✓ Art. 32 | ✓ Req. 6.5.1 | ✓ CC6.1 | ✓ A03 |
| **SQL Injection** | Dynamic query construction | ✓ §164.312(e)(1) | ✓ Art. 32 | ✓ Req. 6.5.1 | ✓ CC6.1 | ✓ A03 |
| **Credential Exposure** | Hardcoded secrets | ✓ §164.312(a)(2) | ✓ Art. 32 | ✓ Req. 3.2 | ✓ CC6.1 | ✓ A07 |
| **Information Disclosure** | System info leakage | ✓ §164.312(e)(1) | ✓ Art. 32 | ✓ Req. 6.5.5 | ✓ CC6.1 | ✓ A01 |
| **Excessive Permissions** | Overly broad IAM | ✓ §164.312(a)(1) | ✓ Art. 32 | ✓ Req. 7.1 | ✓ CC6.3 | ✓ A01 |
| **Unencrypted Storage** | Missing encryption | ✓ §164.312(a)(2) | ✓ Art. 32 | ✓ Req. 3.4 | ✓ CC6.1 | ✓ A02 |
| **Public Data Access** | Open S3 buckets | ✓ §164.312(a)(1) | ✓ Art. 32 | ✓ Req. 7.1 | ✓ CC6.2 | ✓ A01 |
| **Environment Variable PII** | SSN/Email in Lambda env vars | ✓ §164.502(b) | ✓ Art. 6 | ✓ Req. 3.2 | ✓ CC6.1 | ✓ A02 |
| **Database Credentials** | Hardcoded RDS passwords | ✓ §164.312(a)(2) | ✓ Art. 32 | ✓ Req. 3.2 | ✓ CC6.1 | ✓ A07 |
| **Public Database Access** | RDS publicly accessible | ✓ §164.312(a)(1) | ✓ Art. 32 | ✓ Req. 7.1 | ✓ CC6.2 | ✓ A01 |
| **No Database Backups** | Zero backup retention | ✓ §164.308(a)(7) | ✓ Art. 32 | ✓ Req. 3.4 | ✓ CC5.1 | ✓ A02 |
| **Short Log Retention** | 1-day CloudWatch retention | ✓ §164.312(b) | ✓ Art. 30 | ✓ Req. 10.5 | ✓ CC7.1 | ✓ A09 |

### Impact Analysis

#### HIPAA Compliance
- **Primary Focus**: Protected Health Information (PHI) security
- **Key Requirements**: Access controls, audit controls, integrity, transmission security
- **Pipeline Coverage**: 8/8 violation types directly impact HIPAA compliance

#### PCI-DSS Compliance
- **Primary Focus**: Payment card data protection
- **Key Requirements**: Secure development practices, access controls, encryption
- **Pipeline Coverage**: Strong focus on data protection and secure coding practices

#### GDPR Compliance
- **Primary Focus**: Personal data protection and privacy
- **Key Requirements**: Data protection by design, security measures, breach notification
- **Pipeline Coverage**: Comprehensive data exposure and access control validation

## Environment Setup & Configuration

### Infrastructure Requirements

#### EC2 Instance Configuration
```bash
# Minimum specifications
Instance Type: t3.small (2 vCPU, 2 GiB RAM)
Storage: 20 GB EBS volume
Security Group: Port 8080 (Jenkins), Port 22 (SSH)
```

#### Software Dependencies
```bash
# Core runtime environments
sudo yum install java-17-amazon-corretto -y    # Jenkins requirement
sudo yum install python3 python3-pip -y        # Checkov requirement
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install node                                # Node.js for applications
```

### Jenkins Configuration

#### Plugin Installation
The pipeline requires specific Jenkins plugins:
- **Blue Ocean**: Modern pipeline visualization
- **Pipeline**: Core pipeline functionality
- **AWS Credentials**: Secure AWS authentication
- **Node.js**: Node.js tool integration

#### Tool Configuration
```groovy
tools {
    nodejs 'nodejs24'  // Must match Jenkins tool configuration
}
```

#### AWS Credentials Setup
```groovy
withAWS(credentials: 'aws-creds', region: 'eu-west-1') {
    // Deployment commands here
}
```

### Security Configuration

#### Jenkins Security Settings
```bash
# Access Jenkins initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# Configure memory settings for stability
# Navigate to: Manage Jenkins > Nodes > Configure Monitors
# Change 1GiB to 0.9GiB on both fields
```

#### AWS IAM Requirements
The Jenkins execution role requires permissions for:
- CloudFormation stack operations
- Lambda function deployment
- S3 bucket management
- IAM role creation (for Lambda execution roles)

## Deployment Strategy

### Application Selection Logic

The pipeline supports dual-mode operation:

```groovy
script {
    def command = params.APP_NAME == 'secure-app' ?
        'checkov -f template.yaml --config-file .checkov.yaml' :
        'checkov -f template.yaml'
}
```

This allows testing of both vulnerable and secure configurations using the same pipeline infrastructure.

### Build Optimization

The SAM build process includes optimization steps:

```bash
# Clean previous builds
rm -rf .aws-sam node_modules dist build coverage .nyc_output

# Install production dependencies only
npm ci --only=production

# Build with SAM
sam build
```

### Deployment Validation

```yaml
Metadata:
  BuildMethod: esbuild
  BuildProperties:
    Minify: true
    Target: "es2020"
    Sourcemap: false
    TreeShaking: true
    Bundle: true
```

## Monitoring & Reporting

### Pipeline Execution Monitoring

```groovy
post {
    failure {
        echo 'Pipeline failed due to a compliance violation.'
        // Additional notification logic could be added here
    }
    success {
        echo 'Deployment succeeded!'
        // Success notifications and metrics collection
    }
}
```

### Compliance Reporting

#### ESLint Output Format
```bash
/path/to/app.ts
  23:45  error  Potential SQL injection: Template literals with expressions  no-restricted-syntax
  45:12  error  Hardcoded password detected                                  no-secrets/no-secrets
  67:8   error  Exposing stack traces can leak sensitive information         no-restricted-syntax

✖ 3 problems (3 errors, 0 warnings)
```

#### Checkov Reporting
```bash
Check: CKV_AWS_20: "S3 Bucket has an Public Access block"
    FAILED for resource: AWS::S3::Bucket.PublicS3Bucket
    File: /template.yaml:45-55

Check: CKV_AWS_145: "Ensure that S3 buckets are encrypted"
    FAILED for resource: AWS::S3::Bucket.UnencryptedS3Bucket
    File: /template.yaml:78-85
```

### Continuous Improvement

The pipeline design supports iterative security improvements:

1. **Baseline Establishment**: Initial scan identifies all existing violations
2. **Progressive Remediation**: Teams can address violations incrementally
3. **Policy Evolution**: New compliance rules can be added without disrupting existing workflows
4. **Metrics Collection**: Long-term trends in compliance posture can be tracked

This comprehensive approach ensures that security and compliance become integral parts of the development process rather than afterthoughts, significantly reducing the risk of security incidents and regulatory violations in production environments.