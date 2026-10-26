# JOIN API: command and field reference

Auto-generated from `openapi.json` (JOIN API **2.0.0**). Do not hand-edit.

List endpoints return a plain JSON array. Pagination lives in the response headers (`x-page`, `x-page-count`, `x-page-total`); use `--all` to fetch every page.

## Commands

| CLI | Endpoint | Request body | Response |
|---|---|---|---|
| `join-com application-files download` | `GET /application-files/{id}/{externalFileName}` |  | binary (application/pdf) |
| `join-com applications create` | `POST /applications` | [CreateApplication](#createapplication) | [ApplicationId](#applicationid) |
| `join-com applications delete` | `DELETE /applications/{id}` |  | { message } |
| `join-com applications get` | `GET /applications/{id}` |  | [Application](#application) |
| `join-com applications list` | `GET /applications` |  | [Application](#application)[] |
| `join-com applications list-scorecards` | `GET /applications/{id}/scorecards` |  | [Scorecard](#scorecard)[] |
| `join-com applications replace-tags` | `PUT /applications/{id}/tags` | { tags } | { message } |
| `join-com applications update-external-data` | `PATCH /applications/{id}/externalData` | { integrationExternalId } | { applicationId, integrationExternalId } |
| `join-com attachments download` | `GET /attachments/{id}/{externalFileName}` |  | binary (application/pdf) |
| `join-com candidates create-note` | `POST /candidates/{id}/notes` | { content } | [SingleNote](#singlenote) |
| `join-com candidates delete-note` | `DELETE /candidates/{id}/notes/{noteId}` |  | { message } |
| `join-com candidates get` | `GET /candidates/{id}` |  | [Candidate](#candidate) |
| `join-com candidates list` | `GET /candidates` |  | [Candidate](#candidate)[] |
| `join-com candidates list-notes` | `GET /candidates/{id}/notes` |  | [Note](#note)[] |
| `join-com candidates update` | `PATCH /candidates/{id}` | { tags } | { candidate } |
| `join-com candidates update-note` | `PATCH /candidates/{id}/notes/{noteId}` | { content } | [SingleNote](#singlenote) |
| `join-com categories list` | `GET /categories` |  | [CategoryWithChild](#categorywithchild)[] |
| `join-com employment-types list` | `GET /employmentTypes` |  | [EmploymentType](#employmenttype)[] |
| `join-com jobs activate` | `PATCH /jobs/{id}/activate` |  | [JobId](#jobid) |
| `join-com jobs archive` | `PATCH /jobs/{id}/archive` |  | [JobId](#jobid) |
| `join-com jobs change-status` | `PATCH /jobs/{id}/changeStatus` | [UpdateJobStatus](#updatejobstatus) | [JobId](#jobid) |
| `join-com jobs create` | `POST /jobs` | [CreateJob](#createjob) | [JobId](#jobid) |
| `join-com jobs get` | `GET /jobs/{id}` |  | [Job](#job) |
| `join-com jobs list` | `GET /jobs` |  | [Job](#job)[] |
| `join-com jobs update` | `PATCH /jobs/{id}` | [UpdateJob](#updatejob) | [JobId](#jobid) |
| `join-com offices create` | `POST /offices` | [CreateOffice](#createoffice) | [OfficeId](#officeid) |
| `join-com offices get` | `GET /offices/{id}` |  | [Office](#office) |
| `join-com offices list` | `GET /offices` |  | [Office](#office)[] |
| `join-com offices update` | `PATCH /offices/{id}` | [UpdateOffice](#updateoffice) | [OfficeId](#officeid) |
| `join-com seniority-levels list` | `GET /seniorityLevels` |  | [Seniority](#seniority)[] |

## Inline request bodies

### `join-com applications replace-tags`

| field | type | required | description |
|---|---|---|---|
| `tags` | string[] |  | array of application tags |

### `join-com applications update-external-data`

| field | type | required | description |
|---|---|---|---|
| `integrationExternalId` | string |  | external id of the application |

### `join-com candidates create-note`

| field | type | required | description |
|---|---|---|---|
| `content` | string |  | content of the note |

### `join-com candidates update`

| field | type | required | description |
|---|---|---|---|
| `tags` | string[] |  | an array of candidate tags, will replace all current tags with new |

### `join-com candidates update-note`

| field | type | required | description |
|---|---|---|---|
| `content` | string |  | content of the note |

## Schemas

### Application

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the application |
| `createdAt` | string (date-time) |  | creation time of the application |
| `lastUpdatedAt` | string (date-time) |  | update time of the application |
| `attachments` | { type, url }[] |  |  |
| `source` | { product, isPremium } |  |  |
| `job` | { id, title, externalId } |  |  |
| `candidate` | { id, firstName, lastName, email, phoneNumber, country, tags, professionalLinks } |  |  |
| `screeningQuestions` | { question, type, answer, file, isSkipped }[] |  |  |
| `consent` | { id, candidateEmail, consentStatus, consentRequestedAt, consentUpdatedAt, canRequest } |  |  |
| `integrationExternalId` | string |  | external id of the application |
| `state` | `SCREENING` or `QUALIFIED` or `REJECTED` or `HIRED` or `OFFER` |  | Hiring state. SCREENING and QUALIFIED are deprecated and will be removed on 2026-11-01. Please migrate to hiringState before that date. |
| `hiringState` | `APPLIED` or `ACTIVE` or `REJECTED` or `HIRED` or `OFFER` |  | Canonical hiring state. Use instead of the deprecated `state` field. |
| `pipelineStage` | { id, name, type, order } |  |  |
| `currentStage` | { id, name, index } |  | Deprecated. Use `pipelineStage` instead. |

### ApplicationId

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the application |

### Candidate

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | Candidate ID |
| `firstName` | string |  | First name of the candidate |
| `lastName` | string |  | Last name of the candidate |
| `email` | string |  | Primary email address |
| `phone` | string or null |  | Phone number |
| `country` | { name, code } |  | Country of the candidate |
| `source` | string or null |  | Candidate source |
| `tags` | string[] |  | Array of tag names |
| `professionalLinks` | { type, url }[] |  | Array of professional links |
| `consent` | { id, candidateEmail, consentStatus, consentRequestedAt, consentUpdatedAt } |  | Consent status object |
| `applications` | { applicationId, job, state, appliedAt }[] |  | Applications associated with this candidate |
| `notes` | [Note](#note)[] |  | Candidate notes — only present when include=notes is requested |
| `createdAt` | string (date-time) |  | Candidate creation timestamp |

### CategoryWithChild

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the category |
| `slug` | string |  | Category slug |
| `name` | string |  | Category name |
| `subCategories` | { id, slug, name }[] |  |  |

### CreateApplication

| field | type | required | description |
|---|---|---|---|
| `candidate` | { email, firstName, lastName, phone } | yes | candidate to be added to the job |
| `documents` | [CreateDocument](#createdocument)[] |  | documents of the candidate |
| `jobId` | integer | yes | id of the job |
| `source` | `ORGANIC` or `REFERRALS` or `JOB_BOARDS` or `SOCIAL_MEDIA` or `AGENCY` or `SOURCING_TOOLS` or `EVENTS` or `INTERNAL_APPLICATION` or `OTHER` |  | The channel from which the candidate is sourced |
| `integrationExternalId` | string |  | external id of the application |

### CreateDocument

| field | type | required | description |
|---|---|---|---|
| `type` | `CV` or `COVER_LETTER` or `OTHER` or `CERTIFICATE_OF_EMPLOYMENT` or `LETTER_OF_RECOMMENDATION` or `PORTFOLIO` or `CERTIFICATE` or `DIPLOMA` | yes | type of file |
| `name` | string | yes | file name |
| `data` | string | yes | base64 encoded string |

### CreateJob

| field | type | required | description |
|---|---|---|---|
| `externalId` | string |  | id used to identify the job outside Join |
| `title` | string | yes | title of the job |
| `description` | string | yes | description of the job (in html) |
| `salary` | { frequency, from, to, currency, isShownOnJobAd } |  | salary range information |
| `categoryId` | integer | yes | category id of the job (can only be one of sub categories) |
| `language` | string | yes | language code according to [iso 639-1](https://en.wikipedia.org/wiki/ISO_639-1) |
| `officeId` | integer | yes | id of the office you want to assign to this job. Please check offices endpoints for more details |
| `employmentTypeId` | integer | yes | employment type of the job |
| `contact` | { name, email, position } |  | contact person displayed on the job ad |
| `seniorityId` | integer |  | seniority id of the job |
| `contactPerson` | string (email) |  | contact person displayed on the job ad |
| `workplaceType` | `ONSITE` or `REMOTE` or `HYBRID` |  | remote type of the job |
| `remoteType` | `ANYWHERE` or `COUNTRY` |  | type of remote option (only if workplaceType REMOTE): remote from anywhere or remote within country of office |
| `cv` | `REQUIRED` or `OPTIONAL` or `OFF` |  | candidate cv |
| `coverLetter` | `REQUIRED` or `OPTIONAL` or `OFF` |  | candidate cover letter |
| `questions` | [Questions](#questions)[] |  | Screening questions |
| `hiringTeam` | [HiringTeam](#hiringteam)[] |  | Hiring team |
| `status` | `ONLINE` or `OFFLINE` |  | status of the job |

### CreateOffice

| field | type | required | description |
|---|---|---|---|
| `countryIso` | string | yes | country code according to [iso-3166-1-alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) |
| `name` | string |  | name of the office |
| `city` | string | yes | City where the office is located |
| `streetName` | string |  | Name of the street where the office is located |
| `streetNumber` | string |  | The number on the street of office |
| `postalCode` | string |  | Office postal code |
| `isDefault` | boolean |  | Whether this is the default preselected office for the job ads. Note: only one office can be a default at a time. |

### EmploymentType

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the employment type |
| `slug` | string |  | Employment type slug |
| `name` | string |  | Employment type name |

### Error

| field | type | required | description |
|---|---|---|---|
| `error` | { type, message } |  |  |

### HiringTeam

| field | type | required | description |
|---|---|---|---|
| `hiringTeamMember` | string | yes | hiring team member email |
| `jobRole` | `admin` or `hiring_manager` or `reviewer` | yes | type of job role |

### Job

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the job |
| `createdAt` | string (date-time) |  | creation time of the job |
| `lastUpdatedAt` | string (date-time) |  | update time of the job |
| `description` | string |  | description of the job (in html, only returned if content is set to true as query parameter) |
| `externalId` | string |  | id used to identify the job outside Join |
| `title` | string |  | title of the job |
| `status` | string |  | indicates the status of the job, can either be ONLINE \| OFFLINE \| ARCHIVED |
| `remote` | boolean |  | whether the job can be performed remotely |
| `office` | [Office](#office) |  | the office location where the position if offered |
| `salary` | { from, to, currency, isShownOnJobAd, frequency } |  | salary range information (only returned if content is set to true as query parameter) |
| `contact` | { name, email, position } |  | contact person displayed on the job ad (only returned if content is set to true as query parameter) |
| `contactPerson` | string (email) |  | contact person displayed on the job ad (only returned if content is set to true as query parameter) |
| `attachments` | { type, constraint }[] |  | configuration of which attachements candidates can upload when applying (only returned if content is set to true as query parameter) |
| `cv` | `REQUIRED` or `OPTIONAL` or `OFF` |  | constraint of the cv when candidates apply to the job |
| `coverLetter` | `REQUIRED` or `OPTIONAL` or `OFF` |  | constraint of the cover letter when candidates apply to the job |
| `employmentTypeId` | integer |  | employment type id of the job (only returned if content is set to true as query parameter) |
| `categoryId` | integer |  | category id of the job (only returned if content is set to true as query parameter) |
| `seniorityId` | integer |  | seniority id required for the job (only returned if content is set to true as query parameter) |
| `language` | string |  | language code according to [iso 639-1](https://en.wikipedia.org/wiki/ISO_639-1) (only returned if content is set to true as query parameter) |
| `followers` | string[] |  | Array of followers that receive email notifications when new candidates apply (only returned if content is set to true as query parameter). Deprecated: please use Hiring Team instead. |
| `workplaceType` | string |  | remote type of the job |
| `remoteType` | string |  | type of remote option (only if workplaceType REMOTE) |
| `questions` | [ScreeningQuestion](#screeningquestion)[] |  | Job Screening Questions |
| `hiringTeam` | [HiringTeam](#hiringteam)[] |  | array of hiring team users |

### JobId

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the job |

### Note

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the candidate note |
| `userEmail` | string |  | email address of the user who created the note |
| `content` | string |  | content of the note |
| `createdAt` | string (date-time) |  | creation time of the note |
| `lastUpdatedAt` | string (date-time) |  | update time of the note |
| `isPrivate` | boolean |  | whether the note is private |
| `replies` | [ReplyNote](#replynote)[] |  |  |

### Office

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the office |
| `name` | string |  | name of the office |
| `countryIso` | string |  | country code according to [iso-3166-1-alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) |
| `city` | string |  | City where the office is located |
| `streetName` | string |  | Name of the street where the office is located |
| `streetNumber` | string |  | The number on the street of office |
| `postalCode` | string |  | Office postal code |
| `isDefault` | boolean |  | Whether this is the default preselected office for the job ads |

### OfficeId

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the office |

### Questions

| field | type | required | description |
|---|---|---|---|
| `name` | string | yes | screening question |
| `type` | `TEXT` or `BOOLEAN` or `INTEGER` or `DATE` or `SINGLE_CHOICE` or `MULTI_CHOICE` or `FILE` | yes | type of the document to be provided |
| `options` | string[] |  | constraint on the obligation to provide the document |
| `required` | boolean | yes | set question as required |
| `oneOf` | unknown |  |  |

### ReplyNote

| field | type | required | description |
|---|---|---|---|
| `userEmail` | string |  | email address of the user who created the reply note |
| `content` | string |  | content of the reply note |
| `createdAt` | string (date-time) |  | creation time of the reply note |
| `lastUpdatedAt` | string (date-time) |  | update time of the reply note |

### Scorecard

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | Id of the scorecard |
| `submittedBy` | { userId, firstName, lastName, email } |  |  |
| `overAllRecommendation` | number |  | Overall recommendation score |
| `overAllImpression` | string |  | Overall impression text |
| `dateOfSubmission` | string (date-time) |  | Date when the scorecard was submitted |
| `createdAt` | string (date-time) |  | Date when the scorecard was created |
| `updatedAt` | string (date-time) |  | Date when the scorecard was last updated |
| `attributes` | [ScorecardAttribute](#scorecardattribute)[] |  |  |
| `questions` | [ScorecardQuestion](#scorecardquestion)[] |  |  |

### ScorecardAttribute

| field | type | required | description |
|---|---|---|---|
| `name` | string |  | Name of the attribute |
| `rating` | number |  | Score value for the attribute |

### ScorecardQuestion

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | Id of the question |
| `question` | string |  | The question text |
| `answer` | string |  | The interviewer's answer |

### ScreeningQuestion

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | question id |
| `name` | string |  | question name |
| `type` | `TEXT` or `BOOLEAN` or `INTEGER` or `DATE` or `SINGLE_CHOICE` or `MULTI_CHOICE` or `FILE` |  | type of the answer for this question |
| `options` | string[] |  | array of options allowed as answer when the question type is SINGLE_CHOICE or MULTI_CHOICE |
| `required` | boolean |  | when set to true makes the question required for the candidate |

### Seniority

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the seniority |
| `slug` | string |  | Seniority slug |
| `name` | string |  | Seniority name |

### SingleNote

| field | type | required | description |
|---|---|---|---|
| `id` | integer |  | id of the candidate note |
| `userEmail` | string |  | email address of the user who created the note |
| `content` | string |  | content of the note |
| `createdAt` | string (date-time) |  | creation time of the note |
| `lastUpdatedAt` | string (date-time) |  | update time of the note |
| `isPrivate` | boolean |  | whether the note is private |

### UpdateJob

| field | type | required | description |
|---|---|---|---|
| `externalId` | string or null |  | id used to identify the job outside Join |
| `title` | string |  | title of the job |
| `officeId` | integer |  | id of the office you want to assign to this job. Please check offices endpoints for more details |
| `description` | string |  | description of the job (in html) |
| `salary` | { frequency, from, to, currency, isShownOnJobAd } |  | salary range information |
| `categoryId` | integer |  | category id of the job (can only be one of sub categories) |
| `language` | string |  | language code according to [iso 639-1](https://en.wikipedia.org/wiki/ISO_639-1) |
| `employmentTypeId` | integer |  | employment type of the job |
| `contact` | { name, email, position } |  | contact person displayed on the job ad |
| `hiringTeam` | [HiringTeam](#hiringteam)[] |  | Hiring team |
| `seniorityId` | integer |  | seniority id of the job |
| `contactPerson` | string (email) or null |  | contact person displayed on the job ad |
| `workplaceType` | `ONSITE` or `REMOTE` or `HYBRID` |  | remote type of the job |
| `remoteType` | `ANYWHERE` or `COUNTRY` |  | type of remote option (only if workplaceType REMOTE): remote from anywhere or remote within country of office |
| `cv` | `REQUIRED` or `OPTIONAL` or `OFF` |  | candidate cv |
| `coverLetter` | `REQUIRED` or `OPTIONAL` or `OFF` |  | candidate cover letter |
| `questions` | [Questions](#questions)[] |  | Screening questions |

### UpdateJobStatus

| field | type | required | description |
|---|---|---|---|
| `status` | `ONLINE` or `OFFLINE` or `ARCHIVED` |  | status of the job |

### UpdateOffice

| field | type | required | description |
|---|---|---|---|
| `countryIso` | string |  | country code according to [iso-3166-1-alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) |
| `name` | string |  | name of the office |
| `city` | string |  | City where the office is located |
| `streetName` | string or null |  | Name of the street where the office is located |
| `streetNumber` | string or null |  | The number on the street of office |
| `postalCode` | string or null |  | Office postal code |
| `isDefault` | boolean |  | Whether this is the default preselected office for the job ads Note: only one office can be a default at a time. |

### ValidationError

| field | type | required | description |
|---|---|---|---|
| `message` | string |  |  |
| `errors` | { path, message, errorCode }[] |  |  |
