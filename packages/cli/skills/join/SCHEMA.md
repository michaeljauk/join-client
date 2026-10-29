# JOIN API: command and field reference

Auto-generated from `openapi.json` (JOIN API **2026-11-01**). Do not hand-edit.

Responses wrap the payload under `data`. Paginated list endpoints return `{ data, nextCursor }`; pass `nextCursor` back with `--cursor`, or use `--all` to fetch every page as one array. Errors return `{ error: { code, message, details? } }`.

## Commands

| CLI | Endpoint | Request body | Response |
|---|---|---|---|
| `join-com applications create` | `POST /applications` | [CreateApplication](#createapplication) | [ApplicationEnvelope](#applicationenvelope) |
| `join-com applications get` | `GET /applications/{id}` |  | [ApplicationEnvelope](#applicationenvelope) |
| `join-com applications list` | `GET /applications` |  | [ApplicationsPage](#applicationspage) |
| `join-com applications move-stage` | `PUT /applications/{id}/stage` | [UpdateApplicationStage](#updateapplicationstage) | [ApplicationEnvelope](#applicationenvelope) |
| `join-com applications update` | `PATCH /applications/{id}` | [UpdateApplication](#updateapplication) | [ApplicationEnvelope](#applicationenvelope) |
| `join-com candidates create-note` | `POST /candidates/{candidateId}/notes` | [CreateNote](#createnote) | [NoteEnvelope](#noteenvelope) |
| `join-com candidates delete` | `DELETE /candidates/{id}` |  | none |
| `join-com candidates delete-note` | `DELETE /candidates/{candidateId}/notes/{noteId}` |  | none |
| `join-com candidates get` | `GET /candidates/{id}` |  | [CandidateEnvelope](#candidateenvelope) |
| `join-com candidates list` | `GET /candidates` |  | [CandidatesPage](#candidatespage) |
| `join-com candidates list-notes` | `GET /candidates/{candidateId}/notes` |  | [NotesPage](#notespage) |
| `join-com contract-types list` | `GET /contract-types` |  | [ContractTypesList](#contracttypeslist) |
| `join-com employment-types list` | `GET /employment-types` |  | [EmploymentTypesList](#employmenttypeslist) |
| `join-com jobs create` | `POST /jobs` | [CreateJob](#createjob) | [JobEnvelope](#jobenvelope) |
| `join-com jobs get` | `GET /jobs/{id}` |  | [JobEnvelope](#jobenvelope) |
| `join-com jobs list` | `GET /jobs` |  | [JobsPage](#jobspage) |
| `join-com jobs update` | `PATCH /jobs/{id}` | [UpdateJob](#updatejob) | [JobEnvelope](#jobenvelope) |
| `join-com locations create` | `POST /locations` | [CreateLocation](#createlocation) | [LocationEnvelope](#locationenvelope) |
| `join-com locations delete` | `DELETE /locations/{id}` |  | none |
| `join-com locations get` | `GET /locations/{id}` |  | [LocationEnvelope](#locationenvelope) |
| `join-com locations list` | `GET /locations` |  | [LocationsPage](#locationspage) |
| `join-com locations update` | `PATCH /locations/{id}` | [UpdateLocation](#updatelocation) | [LocationEnvelope](#locationenvelope) |
| `join-com pipeline-templates list` | `GET /pipeline-templates` |  | [PipelineTemplatesList](#pipelinetemplateslist) |
| `join-com remote-regions list` | `GET /remote-regions` |  | [RemoteRegionsList](#remoteregionslist) |
| `join-com scorecards list` | `GET /scorecards` |  | [ScorecardsList](#scorecardslist) |

## Schemas

### Application

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `jobId` | integer | yes | ID of the job applied to |
| `externalId` | string or null | yes | Your own reference for this application, set through the create or update endpoint. Limited to 50 characters; a longer value is refused with `validation_error`. |
| `candidate` | [ApplicationCandidate](#applicationcandidate) | yes |  |
| `status` | [ApplicationStatus](#applicationstatus) | yes |  |
| `currentStage` | [ApplicationStage](#applicationstage) | yes | The stage the application sits in, including `APPLIED` for one rejected by a knockout question; `null` only when JOIN holds no stage for it |
| `documents` | [ApplicationDocument](#applicationdocument)[] | yes | Documents attached to the application, with pre-signed links valid for 1 hour |
| `screeningQuestions` | [ScreeningQuestionAnswer](#screeningquestionanswer)[] | yes | The job’s custom screening questions with this candidate’s answers |
| `source` | [Source](#source) | yes |  |
| `createdAt` | string (date-time) | yes | When the application was created |
| `updatedAt` | string (date-time) | yes | When the application was last changed |

### ApplicationCandidate

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier of the candidate within your company |
| `firstName` | string | yes | First name |
| `lastName` | string or null | yes | Last name |
| `email` | string | yes | Email address, as held for your company |
| `phoneNumber` | string or null | yes | Phone number |
| `countryCode` | string or null | yes | Country of residence as an ISO 3166-1 alpha-2 code |
| `professionalLinks` | [ProfessionalLink](#professionallink)[] | yes | Links from the candidate’s talent profile. Read-only |
| `tags` | string[] | yes | Tag names applied to the candidate by your company |
| `consent` | [CandidateConsent](#candidateconsent) | yes |  |

### ApplicationDocument

| field | type | required | description |
|---|---|---|---|
| `type` | [DocumentType](#documenttype) | yes |  |
| `name` | string | yes | File name including its extension |
| `url` | string | yes | Pre-signed download link, valid for 1 hour from the moment the response was generated |

### ApplicationEnvelope

| field | type | required | description |
|---|---|---|---|
| `data` | [Application](#application) | yes |  |

### ApplicationForm

| field | type | required | description |
|---|---|---|---|
| `documents` | [ApplicationFormDocument](#applicationformdocument)[] | yes | Documents asked for, before the custom questions. `CV` is always present |
| `screeningQuestions` | [ScreeningQuestion](#screeningquestion)[] | yes | Custom questions, after the documents, in ascending `order` |

### ApplicationFormDocument

| field | type | required | description |
|---|---|---|---|
| `type` | [DocumentType](#documenttype) | yes |  |
| `constraint` | [DocumentConstraint](#documentconstraint) | yes |  |

### ApplicationStage

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `name` | string | yes | Stage name as configured on the pipeline |
| `type` | [PipelineStageType](#pipelinestagetype) | yes |  |
| `order` | integer | yes | Position in the pipeline, from 1 |

### ApplicationStatus

`ACTIVE` or `REJECTED` or `HIRED`

### ApplicationsPage

| field | type | required | description |
|---|---|---|---|
| `data` | [Application](#application)[] | yes | The array of records |
| `nextCursor` | string or null | yes | The cursor to pass on the next request. `null` when there are no more records |

### AssignableHiringTeamRole

`ADMIN` or `HIRING_MANAGER` or `REVIEWER`

### AttributeRating

`NOT_RATED` or `WEAK` or `ADEQUATE` or `STRONG` or `EXCEPTIONAL`

### Candidate

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier of the candidate within your company |
| `firstName` | string | yes | First name |
| `lastName` | string or null | yes | Last name |
| `email` | string | yes | Email address, as held for your company |
| `phoneNumber` | string or null | yes | Phone number |
| `countryCode` | string or null | yes | Country of residence as an ISO 3166-1 alpha-2 code |
| `source` | [Source](#source) | yes | Where the candidate came from |
| `tags` | string[] | yes | Tag names applied to the candidate by your company |
| `professionalLinks` | [ProfessionalLink](#professionallink)[] | yes | Links from the candidate’s talent profile. Read-only |
| `consent` | [CandidateConsent](#candidateconsent) | yes |  |
| `applications` | [CandidateApplicationSummary](#candidateapplicationsummary)[] | yes | Every application this candidate has in your company |
| `createdAt` | string (date-time) | yes | When the candidate was created in your company |
| `updatedAt` | string (date-time) | yes | When the candidate was last changed |

### CandidateApplicationSummary

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `jobId` | integer | yes | ID of the job applied to |
| `status` | [ApplicationStatus](#applicationstatus) | yes |  |
| `currentStage` | [ApplicationStage](#applicationstage) | yes | The stage the application sits in, including `APPLIED` for one rejected by a knockout question; `null` only when JOIN holds no stage for it |
| `createdAt` | string (date-time) | yes | When the application was created |

### CandidateConsent

| field | type | required | description |
|---|---|---|---|
| `status` | [ConsentStatus](#consentstatus) | yes |  |
| `requestedAt` | string (date-time) or null | yes | When consent was requested; `null` when it never was |
| `updatedAt` | string (date-time) or null | yes | When the status last changed; `null` when there is no record |

### CandidateEnvelope

| field | type | required | description |
|---|---|---|---|
| `data` | [Candidate](#candidate) | yes |  |

### CandidatesPage

| field | type | required | description |
|---|---|---|---|
| `data` | [Candidate](#candidate)[] | yes | The array of records |
| `nextCursor` | string or null | yes | The cursor to pass on the next request. `null` when there are no more records |

### Compensation

| field | type | required | description |
|---|---|---|---|
| `salary` | [Salary](#salary) |  | The salary; `null` when none is set |
| `visibility` | [SalaryVisibility](#salaryvisibility) | yes |  |

### ConsentStatus

`ACCEPTED` or `REJECTED` or `PENDING`

### ConsentStatusFilter

`ACCEPTED` or `PENDING`

### ContactPerson

| field | type | required | description |
|---|---|---|---|
| `name` | string | yes | Full name |
| `title` | string or null |  | Position |
| `email` | string (email) | yes | Email |

### ContractType

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `name` | string | yes | Display name |
| `employmentType` | { id, name } | yes | The employment type this contract type belongs to. |
| `countryCode` | string or null | yes | ISO 3166-1 alpha-2 code of the country it applies to. `null` for a generic type, which is what a remote job uses |
| `hasUnlimitedDuration` | boolean | yes | When `true`, `employmentTerms.durationMonths` must be `null` |
| `maxDurationMonths` | integer or null | yes | Upper bound for `employmentTerms.durationMonths` |
| `hasNoProbation` | boolean | yes | When `true`, `employmentTerms.probationMonths` must be `null` |
| `maxProbationMonths` | integer or null | yes | Upper bound for `employmentTerms.probationMonths` |
| `hasNoVacation` | boolean | yes | When `true`, `employmentTerms.annualVacationDays` must be `null` |
| `minWeeklyWorkingHours` | integer | yes | Lower bound for `employmentTerms.weeklyWorkingHours` |
| `maxWeeklyWorkingHours` | integer | yes | Upper bound for `employmentTerms.weeklyWorkingHours` |

### ContractTypesList

| field | type | required | description |
|---|---|---|---|
| `data` | [ContractType](#contracttype)[] | yes | The array of records |

### CreateApplication

| field | type | required | description |
|---|---|---|---|
| `jobId` | integer | yes | ID of the job to apply to. The job must not be archived |
| `externalId` | string |  | Your own reference for this application. Limited to 50 characters; a longer value is refused with `validation_error`. Must contain at least one non-whitespace character. |
| `candidateId` | integer |  | ID of an existing candidate in your company. Either supply this field or `candidate`, not both |
| `candidate` | [CreateApplicationCandidate](#createapplicationcandidate) |  | A candidate described inline. When the email is already known to your company, that candidate is reused rather than the request being refused. Either supply this field or `candidateId`, not both |
| `documents` | [CreateApplicationDocument](#createapplicationdocument)[] |  | Documents for this application. When omitted, an existing candidate’s profile CV and cover letter are carried forward; no other document type is |

### CreateApplicationCandidate

| field | type | required | description |
|---|---|---|---|
| `firstName` | string | yes | First name |
| `lastName` | string | yes | Last name |
| `email` | string (email) | yes | Email address |
| `phoneNumber` | string |  | Phone number |
| `countryCode` | string |  | Country of residence as an ISO 3166-1 alpha-2 code |
| `tags` | string[] |  | Tag names to apply to the candidate. Unknown names are created in your company’s tag catalog |

### CreateApplicationDocument

| field | type | required | description |
|---|---|---|---|
| `type` | [DocumentType](#documenttype) | yes |  |
| `data` | string | yes | The file, base64-encoded. Maximum 10 MB decoded. Invalid encoding or an unsupported file type returns a `validation_error` identifying the document. |
| `name` | string | yes | File name including its extension |

### CreateJob

| field | type | required | description |
|---|---|---|---|
| `status` | [CreateJobStatus](#createjobstatus) |  |  |
| `title` | string | yes | Job title, 3–100 characters |
| `description` | string | yes | Job description as HTML. The visible text must be 200–10,000 characters; HTML markup does not count toward the limit. Allowed tags: `<p>`, `<br>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<h2>` and `<h3>`, without attributes. Any other tag, links included, is removed and its text kept; scripts and embedded content are removed entirely. |
| `languageCode` | [LanguageCode](#languagecode) |  | The language the ad is written in. Defaults to your company’s |
| `priority` | [JobPriority](#jobpriority) |  | How urgently the role needs filling |
| `openings` | integer |  | Positions to fill. Omitted, 1 |
| `workLocation` | [WorkLocationInput](#worklocationinput) | yes |  |
| `contractTypeId` | integer | yes | Contract type ID from [List contract types](listcontracttypes). This determines the job’s employment type. |
| `employmentTerms` | { weeklyWorkingHours, durationMonths, probationMonths, annualVacationDays, startDate } |  | Contract terms, each optional. An omitted or `null` term stays empty: JOIN applies no default. Each value is validated against the contract type’s bounds. |
| `compensation` | { salary, visibility } |  | What the job pays. Omit the whole object for no salary, which keeps the salary `HIDDEN`. |
| `applicationForm` | { documents, screeningQuestions } |  | What the candidate is asked to provide. Replaced in full on write. Omitted on create, the form keeps `CV` required and carries no custom questions. |
| `pipelineTemplateId` | integer |  | The pipeline template the job’s stages are created from; see `GET /pipeline-templates`. Defaults to your company’s default |
| `hiringTeam` | { email, role }[] |  | Who to invite. Omitted, nobody is invited. System Admins reach the job regardless |
| `contactPersonEmail` | string (email) |  | Company member shown on the public ad |
| `externalId` | string |  | Your own reference for the job. Multiple jobs can share this value; the `externalId` filter returns all matches. Shown in the product as *Internal Job ID* |

### CreateJobStatus

`ONLINE` or `OFFLINE`

### CreateLocation

| field | type | required | description |
|---|---|---|---|
| `name` | string |  | Location name |
| `address` | [LocationAddressInput](#locationaddressinput) | yes |  |
| `establishmentId` | string |  | Official establishment registration number (e.g. SIRET in France); only for countries that use one |
| `isDefault` | boolean |  | Whether this is the default location preselected for job ads |

### CreateNote

| field | type | required | description |
|---|---|---|---|
| `content` | string | yes | The note text |

### DocumentConstraint

`REQUIRED` or `OPTIONAL`

### DocumentType

`CV` or `COVER_LETTER`

### EmploymentTerms

| field | type | required | description |
|---|---|---|---|
| `weeklyWorkingHours` | integer or null |  | Weekly hours, within the contract type’s minimum and maximum |
| `durationMonths` | integer or null |  | Contract length. `null` when the contract type has unlimited duration |
| `probationMonths` | integer or null |  | Probation length. `null` when the contract type has no probation |
| `annualVacationDays` | integer or null |  | Paid vacation days per year. `null` when the contract type has no vacation |
| `startDate` | string (date) or null |  | When the role starts, 30 or more days ahead. `null` when it starts as soon as possible |

### EmploymentType

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `name` | string | yes | Display name |
| `slug` | string | yes | Slug; the value the `employmentType` job filter takes |

### EmploymentTypesList

| field | type | required | description |
|---|---|---|---|
| `data` | [EmploymentType](#employmenttype)[] | yes | The array of records |

### Error

| field | type | required | description |
|---|---|---|---|
| `error` | { code, message } | yes |  |

### FieldError

| field | type | required | description |
|---|---|---|---|
| `field` | string | yes | Dotted path of the offending field, as sent in the request (e.g. `address.city`). `body` when the whole payload is at fault. |
| `in` | `body` or `query` or `path` | yes | Where the offending field was sent: the request `body`, a `query` parameter or a `path` parameter. |
| `message` | string | yes | Human-readable reason this field was rejected. |

### FixedHybridScheduleInput

| field | type | required | description |
|---|---|---|---|
| `type` | `FIXED` | yes |  |
| `fixedWeeklyDays` | [WeekDay](#weekday)[] | yes | The named in-office days |

### FlexibleHybridScheduleInput

| field | type | required | description |
|---|---|---|---|
| `type` | `FLEXIBLE` | yes |  |
| `weeklyInOfficeDays` | integer | yes | Days per week in the office |

### HiringTeamMember

| field | type | required | description |
|---|---|---|---|
| `user` | [HiringTeamUser](#hiringteamuser) | yes |  |
| `role` | [HiringTeamRole](#hiringteamrole) | yes |  |

### HiringTeamRole

`SYSTEM_ADMIN` or `ADMIN` or `HIRING_MANAGER` or `REVIEWER`

### HiringTeamUser

| field | type | required | description |
|---|---|---|---|
| `name` | string | yes | Full name |
| `email` | string (email) | yes | The company user’s email address. Use this address when assigning a hiring-team member. |

### HybridSchedule

| field | type | required | description |
|---|---|---|---|
| `type` | [HybridScheduleType](#hybridscheduletype) | yes |  |
| `weeklyInOfficeDays` | integer or null |  | Days per week in the office. Only when `type` is `FLEXIBLE` |
| `fixedWeeklyDays` | [WeekDay](#weekday)[] |  | The named in-office days. Only when `type` is `FIXED` |

### HybridScheduleInput

[FlexibleHybridScheduleInput](#flexiblehybridscheduleinput) or [FixedHybridScheduleInput](#fixedhybridscheduleinput)

### HybridScheduleType

`FLEXIBLE` or `FIXED`

### HybridWorkLocationInput

| field | type | required | description |
|---|---|---|---|
| `workplaceType` | `HYBRID` | yes |  |
| `locationId` | integer | yes | The location; see `GET /locations` |
| `hybridSchedule` | [HybridScheduleInput](#hybridscheduleinput) |  |  |

### Job

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `status` | [JobStatus](#jobstatus) | yes |  |
| `title` | string | yes | Job title, 3–100 characters |
| `description` | string | yes | Job description as HTML. Never `null` |
| `languageCode` | [LanguageCode](#languagecode) | yes |  |
| `priority` | [JobPriority](#jobpriority) | yes |  |
| `openings` | integer | yes | Positions to fill, at least 1. Decremented by one each time a candidate is marked hired, while it is above 1 |
| `externalId` | string or null | yes | Your own reference for the job. Multiple jobs can share this value; the `externalId` filter returns all matches. Shown in the product as *Internal Job ID* |
| `url` | string or null | yes | Public job ad URL; `null` when there is no live listing. The URL is refreshed roughly every 30 days. Use the job’s `id` as its stable identifier. |
| `employmentType` | [EmploymentType](#employmenttype) | yes | Read-only; follows from the contract type |
| `contractType` | [JobContractType](#jobcontracttype) | yes | Set with `contractTypeId` |
| `employmentTerms` | [EmploymentTerms](#employmentterms) | yes | Contract terms |
| `workLocation` | [WorkLocation](#worklocation) | yes |  |
| `compensation` | [Compensation](#compensation) | yes |  |
| `applicationForm` | [ApplicationForm](#applicationform) | yes |  |
| `hiringTeam` | [HiringTeamMember](#hiringteammember)[] | yes | Everyone who can access this job, including company System Admins. Changes to company roles can also change this list. |
| `contactPerson` | [ContactPerson](#contactperson) | yes | The person shown on the public ad |
| `stages` | [PipelineStage](#pipelinestage)[] | yes | The job’s hiring stages in ascending `order`, starting with `APPLIED`. Their IDs are what `PUT /applications/{id}/stage` accepts |
| `createdAt` | string (date-time) | yes | Creation time |
| `updatedAt` | string (date-time) | yes | Last update time |

### JobContractType

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Identifier; see `GET /contract-types` |
| `name` | string | yes | Display name |

### JobEnvelope

| field | type | required | description |
|---|---|---|---|
| `data` | [Job](#job) | yes |  |

### JobLocation

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Identifier; see `GET /locations` |
| `name` | string | yes | Location name |
| `city` | string | yes | City |
| `countryCode` | string | yes | ISO 3166-1 alpha-2 country code |

### JobPriority

`LOW` or `NORMAL` or `HIGH` or `URGENT`

### JobStatus

`ONLINE` or `OFFLINE` or `ARCHIVED`

### JobsPage

| field | type | required | description |
|---|---|---|---|
| `data` | [Job](#job)[] | yes | The array of records |
| `nextCursor` | string or null | yes | The cursor to pass on the next request. `null` when there are no more records |

### LanguageCode

`nl` or `en` or `fr` or `de` or `it` or `es`

### Location

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `name` | string or null | yes | Location name |
| `address` | [LocationAddress](#locationaddress) | yes |  |
| `establishmentId` | string or null | yes | Official establishment registration number for the location's country (e.g. SIRET in France, 14 digits). `null` when not set or not applicable |
| `isDefault` | boolean | yes | Whether this is the default location preselected for job ads |

### LocationAddress

| field | type | required | description |
|---|---|---|---|
| `countryCode` | string | yes | Country code |
| `city` | string | yes | City the location is in |
| `streetName` | string or null | yes | Street name |
| `streetNumber` | string or null | yes | Street number |
| `postalCode` | string or null | yes | Postal code; validated against `countryCode` |

### LocationAddressInput

| field | type | required | description |
|---|---|---|---|
| `countryCode` | string | yes | Country code |
| `city` | string | yes | City the location is in |
| `streetName` | string |  | Street name |
| `streetNumber` | string |  | Street number |
| `postalCode` | string |  | Postal code; validated against `countryCode` |

### LocationEnvelope

| field | type | required | description |
|---|---|---|---|
| `data` | [Location](#location) | yes |  |

### LocationsPage

| field | type | required | description |
|---|---|---|---|
| `data` | [Location](#location)[] | yes | The array of records |
| `nextCursor` | string or null | yes | The cursor to pass on the next request. `null` when there are no more records |

### Note

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `content` | string | yes | The text supplied when the note was created. New notes are limited to 2,500 characters; older notes retain their original length. |
| `isPrivate` | boolean | yes | Whether the note is private between recruiters in JOIN. Company API tokens can read both private and shared notes. Notes created through the API have `isPrivate: false`. |
| `replies` | [NoteReply](#notereply)[] | yes | Replies on this note, up to 150 |
| `createdAt` | string (date-time) | yes | When the note was created |
| `updatedAt` | string (date-time) | yes | When the note was last changed |

### NoteEnvelope

| field | type | required | description |
|---|---|---|---|
| `data` | [Note](#note) | yes |  |

### NoteReply

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `content` | string | yes | The reply text |
| `createdAt` | string (date-time) | yes | When the reply was created |
| `updatedAt` | string (date-time) | yes | When the reply was last changed |

### NotesPage

| field | type | required | description |
|---|---|---|---|
| `data` | [Note](#note)[] | yes | The array of records |
| `nextCursor` | string or null | yes | The cursor to pass on the next request. `null` when there are no more records |

### OnsiteWorkLocationInput

| field | type | required | description |
|---|---|---|---|
| `workplaceType` | `ONSITE` | yes |  |
| `locationId` | integer | yes | The location; see `GET /locations` |

### OverallRecommendation

`DEFINITELY_NO` or `NO` or `YES` or `DEFINITELY_YES`

### PipelineStage

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier — the value to send to the stage move |
| `name` | string | yes | Stage name as configured on the pipeline |
| `type` | [PipelineStageType](#pipelinestagetype) | yes |  |
| `order` | integer | yes | Position in the pipeline, from 1 |

### PipelineStageType

`APPLIED` or `APPLICATION_REVIEW` or `SCREENING` or `PHONE_CALL` or `ASSESSMENT` or `CASE_STUDY` or `INTERVIEW` or `OFFER` or `HIRED`

### PipelineTemplate

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `name` | string | yes | Pipeline template name |
| `stages` | [PipelineStage](#pipelinestage)[] | yes | The stages in ascending `order`, starting with the `APPLIED` stage |

### PipelineTemplatesList

| field | type | required | description |
|---|---|---|---|
| `data` | [PipelineTemplate](#pipelinetemplate)[] | yes | The array of records |
| `nextCursor` | string or null | yes | The cursor to pass on the next request. `null` when there are no more records |

### ProfessionalLink

| field | type | required | description |
|---|---|---|---|
| `type` | [ProfessionalLinkType](#professionallinktype) | yes |  |
| `url` | string | yes | The link |

### ProfessionalLinkType

`LINKEDIN` or `PERSONAL_WEBSITE` or `PORTFOLIO` or `BEHANCE` or `GITHUB` or `XING`

### RejectIfComparator

`GREATER_THAN` or `LESS_THAN` or `EQUAL_TO`

### RemoteAnywhereWorkLocationInput

| field | type | required | description |
|---|---|---|---|
| `workplaceType` | `REMOTE` | yes |  |
| `remoteType` | `ANYWHERE` | yes |  |

### RemoteCountryWorkLocationInput

| field | type | required | description |
|---|---|---|---|
| `workplaceType` | `REMOTE` | yes |  |
| `remoteType` | `COUNTRY` | yes |  |
| `countryCode` | string | yes | ISO 3166-1 alpha-2 country code |

### RemoteRegion

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `name` | string | yes | Display name |
| `code` | string or null | yes | Short code |
| `countryCodes` | string[] | yes | ISO 3166-1 alpha-2 codes of the countries in the region |

### RemoteRegionWorkLocationInput

| field | type | required | description |
|---|---|---|---|
| `workplaceType` | `REMOTE` | yes |  |
| `remoteType` | `REGION` | yes |  |
| `remoteRegionId` | integer | yes | The region; see `GET /remote-regions` |

### RemoteRegionsList

| field | type | required | description |
|---|---|---|---|
| `data` | [RemoteRegion](#remoteregion)[] | yes | The array of records |

### RemoteType

`ANYWHERE` or `COUNTRY` or `REGION`

### RemoteWorkLocationInput

| field | type | required | description |
|---|---|---|---|
| `workplaceType` | `REMOTE` | yes |  |

### Salary

| field | type | required | description |
|---|---|---|---|
| `from` | integer | yes | Lower bound, or the whole salary when it equals `to` |
| `to` | integer | yes | Upper bound, or the whole salary when it equals `from` |
| `currency` | string | yes | ISO 4217 currency code |
| `frequency` | [SalaryFrequency](#salaryfrequency) | yes |  |

### SalaryFrequency

`YEARLY` or `MONTHLY` or `WEEKLY` or `DAILY` or `HOURLY`

### SalaryVisibility

`PUBLIC` or `HIDDEN`

### Scorecard

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `overallRecommendation` | [OverallRecommendation](#overallrecommendation) | yes |  |
| `overallImpression` | string or null | yes | The interviewer’s written impression; `null` when they gave none |
| `submittedAt` | string (date-time) | yes | When the scorecard was published |
| `attributes` | [ScorecardAttribute](#scorecardattribute)[] | yes | The rated attributes |
| `questions` | [ScorecardQuestion](#scorecardquestion)[] | yes | The questions in template order |
| `createdAt` | string (date-time) | yes | When the scorecard was created |
| `updatedAt` | string (date-time) | yes | When the scorecard was last changed |

### ScorecardAttribute

| field | type | required | description |
|---|---|---|---|
| `name` | string | yes | Attribute name from the scorecard template |
| `rating` | [AttributeRating](#attributerating) | yes |  |
| `comment` | string or null | yes | The interviewer’s comment on this attribute; `null` when they gave none |

### ScorecardQuestion

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `question` | string | yes | The question as it was asked |
| `answer` | string or null | yes | The interviewer’s answer; `null` when unanswered |

### ScorecardsList

| field | type | required | description |
|---|---|---|---|
| `data` | [Scorecard](#scorecard)[] | yes | The array of records |

### ScreeningQuestion

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Identifier; read-only |
| `order` | integer | yes | Position among the custom questions, from 1 |
| `question` | string | yes | The prompt shown to the candidate |
| `type` | [ScreeningQuestionType](#screeningquestiontype) | yes |  |
| `constraint` | [ScreeningQuestionConstraint](#screeningquestionconstraint) | yes |  |
| `options` | [ScreeningQuestionOption](#screeningquestionoption)[] |  | The choices offered. Only for `SINGLE_CHOICE` and `MULTI_CHOICE` |
| `rejectIf` | [ScreeningQuestionRejectIf](#screeningquestionrejectif) |  | The answer that rejects; `null` unless the question is an `INTEGER`, `DATE` or `BOOLEAN` knockout |

### ScreeningQuestionAnswer

| field | type | required | description |
|---|---|---|---|
| `question` | string | yes | The question as it was asked |
| `type` | [ScreeningQuestionType](#screeningquestiontype) | yes |  |
| `answer` | string or null | yes | The answer for the value-shaped types (`TEXT`, `BOOLEAN`, `INTEGER`, `DATE`); `null` otherwise |
| `selectedOptions` | string[] | yes | The chosen options for `SINGLE_CHOICE` and `MULTI_CHOICE`; `null` otherwise |
| `file` | [ScreeningQuestionFile](#screeningquestionfile) | yes | The uploaded file for a `FILE` question; `null` otherwise |
| `isSkipped` | boolean | yes | Whether the question carries no answer from this candidate |

### ScreeningQuestionConstraint

`REQUIRED` or `OPTIONAL` or `KNOCKOUT`

### ScreeningQuestionFile

| field | type | required | description |
|---|---|---|---|
| `name` | string | yes | File name including its extension |
| `url` | string | yes | Pre-signed download link, valid for 1 hour from the moment the response was generated |

### ScreeningQuestionOption

| field | type | required | description |
|---|---|---|---|
| `label` | string | yes | Shown to the candidate |
| `accepted` | boolean | yes | `false` makes the option reject the application |

### ScreeningQuestionRejectIf

| field | type | required | description |
|---|---|---|---|
| `comparator` | [RejectIfComparator](#rejectifcomparator) | yes |  |
| `value` | integer or string (date) or boolean | yes | The threshold, matching the question’s type: an integer for `INTEGER`, an ISO 8601 date for `DATE`; for `BOOLEAN`, the answer that rejects, `true` or `false`, with `EQUAL_TO` |

### ScreeningQuestionType

`TEXT` or `BOOLEAN` or `INTEGER` or `DATE` or `SINGLE_CHOICE` or `MULTI_CHOICE` or `FILE`

### Source

| field | type | required | description |
|---|---|---|---|
| `id` | integer | yes | Unique identifier |
| `name` | string | yes | Source name |

### UpdateApplication

| field | type | required | description |
|---|---|---|---|
| `externalId` | string or null |  | Your system’s reference for this application. Use a string of 1–50 characters containing at least one non-whitespace character, or `null` to clear it. |

### UpdateApplicationStage

| field | type | required | description |
|---|---|---|---|
| `stageId` | integer | yes | ID of a stage from the job’s `stages`. Moving to the current stage leaves the application unchanged. |

### UpdateJob

| field | type | required | description |
|---|---|---|---|
| `status` | [JobStatus](#jobstatus) |  | Target status. Any direction among the three is allowed; a refusal is always `validation_error` or `job_limit_reached` |
| `title` | string |  | Job title, 3–100 characters |
| `description` | string |  | Job description as HTML. The visible text must be 200–10,000 characters; HTML markup does not count toward the limit. Allowed tags: `<p>`, `<br>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<h2>` and `<h3>`, without attributes. Any other tag, links included, is removed and its text kept; scripts and embedded content are removed entirely. |
| `languageCode` | [LanguageCode](#languagecode) |  | The language of the job ad. Omit to keep the current language. |
| `priority` | [JobPriority](#jobpriority) |  | How urgently the role needs filling. It stays unchanged if this field is omitted |
| `openings` | integer |  | Positions to fill |
| `workLocation` | [WorkLocationInput](#worklocationinput) |  |  |
| `contractTypeId` | integer |  | Contract type ID from [List contract types](listcontracttypes). This determines the job’s employment type. |
| `employmentTerms` | { weeklyWorkingHours, durationMonths, probationMonths, annualVacationDays, startDate } |  | Contract terms. An omitted term stays as it is and a `null` term is cleared; `null` for the whole object clears every term. Each value is validated against the contract type’s bounds, and changing `contractTypeId` drops the stored terms the new contract type does not allow. |
| `compensation` | { salary, visibility } |  | What the job pays. Replaced in full when sent; omitted, it stays as it is. `null` removes the salary and keeps it `HIDDEN`. |
| `applicationForm` | { documents, screeningQuestions } |  | Documents and custom questions for the application form. Omit the object to keep the current form. Supplying it replaces the form in full: omitted `documents` resets to a required CV, and omitted `screeningQuestions` removes the custom questions. |
| `hiringTeam` | { email, role }[] |  | Company users to assign to this job. Omit to keep the current assignments. A supplied array replaces the assignments; `null` clears them. System Admins retain access through their company role. |
| `contactPersonEmail` | string (email) or null |  | Company member shown on the public ad. Sending `null` clears it. |
| `externalId` | string or null |  | Your own reference for the job. Multiple jobs can share this value; the `externalId` filter returns all matches. Shown in the product as *Internal Job ID*. Sending `null` clears it. |

### UpdateLocation

| field | type | required | description |
|---|---|---|---|
| `name` | string |  | Location name |
| `address` | [LocationAddressInput](#locationaddressinput) |  |  |
| `establishmentId` | string or null |  | Official establishment registration number (e.g. SIRET in France); only for countries that use one. Sending `null` clears it |
| `isDefault` | boolean |  | Whether this is the default location preselected for job ads |

### ValidationError

| field | type | required | description |
|---|---|---|---|
| `error` | { code, message, details } | yes |  |

### WeekDay

`MON` or `TUE` or `WED` or `THU` or `FRI` or `SAT` or `SUN`

### WorkLocation

| field | type | required | description |
|---|---|---|---|
| `workplaceType` | [WorkplaceType](#workplacetype) | yes |  |
| `remoteType` | `ANYWHERE` or `COUNTRY` or `REGION` |  | How widely a remote job is scoped; `null` unless `workplaceType` is `REMOTE` |
| `location` | [JobLocation](#joblocation) |  | The location the job is performed at; `null` unless `workplaceType` is `ONSITE` or `HYBRID` |
| `countryCode` | string or null |  | ISO 3166-1 alpha-2 country code. Only for `REMOTE` + `COUNTRY` |
| `remoteRegion` | [RemoteRegion](#remoteregion) |  | The region the job is scoped to; `null` unless `remoteType` is `REGION` |
| `hybridSchedule` | [HybridSchedule](#hybridschedule) |  | The in-office schedule; `null` unless `workplaceType` is `HYBRID`, and for a hybrid job that has none |

### WorkLocationInput

[OnsiteWorkLocationInput](#onsiteworklocationinput) or [HybridWorkLocationInput](#hybridworklocationinput) or [RemoteWorkLocationInput](#remoteworklocationinput)

### WorkplaceType

`ONSITE` or `HYBRID` or `REMOTE`
