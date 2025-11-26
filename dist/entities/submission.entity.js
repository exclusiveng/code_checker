"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Submission = exports.SubmissionStatus = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const user_entity_1 = require("./user.entity");
const review_entity_1 = require("./review.entity");
var SubmissionStatus;
(function (SubmissionStatus) {
    SubmissionStatus["PENDING"] = "pending";
    SubmissionStatus["PASSED"] = "passed";
    SubmissionStatus["FAILED"] = "failed";
    SubmissionStatus["REVIEWED"] = "reviewed";
})(SubmissionStatus || (exports.SubmissionStatus = SubmissionStatus = {}));
let Submission = class Submission {
};
exports.Submission = Submission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Submission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], Submission.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, project => project.submissions),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", project_entity_1.Project)
], Submission.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'developer_id' }),
    __metadata("design:type", String)
], Submission.prototype, "developerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'developer_id' }),
    __metadata("design:type", user_entity_1.User)
], Submission.prototype, "developer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'files_metadata' }),
    __metadata("design:type", Object)
], Submission.prototype, "filesMetadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'zip_url' }),
    __metadata("design:type", String)
], Submission.prototype, "zipUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SubmissionStatus,
        default: SubmissionStatus.PENDING,
    }),
    __metadata("design:type", String)
], Submission.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Submission.prototype, "results", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'github_push_info', nullable: true }),
    __metadata("design:type", Object)
], Submission.prototype, "githubPushInfo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => review_entity_1.Review, review => review.submission),
    __metadata("design:type", Array)
], Submission.prototype, "reviews", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Submission.prototype, "createdAt", void 0);
exports.Submission = Submission = __decorate([
    (0, typeorm_1.Entity)('submissions')
], Submission);
