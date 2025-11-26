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
exports.RuleSet = exports.RuleSeverity = exports.RuleType = void 0;
const typeorm_1 = require("typeorm");
const company_entity_1 = require("./company.entity");
const rule_entity_1 = require("./rule.entity");
const project_entity_1 = require("./project.entity");
var RuleType;
(function (RuleType) {
    RuleType["REGEX"] = "regex";
    RuleType["ESLINT"] = "eslint";
    RuleType["AST"] = "ast";
    RuleType["FILE_PATTERN"] = "filepattern";
    RuleType["CONTENT"] = "content";
})(RuleType || (exports.RuleType = RuleType = {}));
var RuleSeverity;
(function (RuleSeverity) {
    RuleSeverity["ERROR"] = "error";
    RuleSeverity["WARNING"] = "warning";
})(RuleSeverity || (exports.RuleSeverity = RuleSeverity = {}));
let RuleSet = class RuleSet {
};
exports.RuleSet = RuleSet;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RuleSet.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_id' }),
    __metadata("design:type", String)
], RuleSet.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company, company => company.rulesets),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", company_entity_1.Company)
], RuleSet.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RuleSet.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RuleSet.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', nullable: true }),
    __metadata("design:type", String)
], RuleSet.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, project => project.rulesets),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", project_entity_1.Project)
], RuleSet.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rule_entity_1.Rule, rule => rule.ruleSet, { cascade: ['insert', 'update'], eager: true }),
    __metadata("design:type", Array)
], RuleSet.prototype, "rules", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RuleSet.prototype, "createdAt", void 0);
exports.RuleSet = RuleSet = __decorate([
    (0, typeorm_1.Entity)('rulesets')
], RuleSet);
