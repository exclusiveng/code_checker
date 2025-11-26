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
exports.Rule = exports.RuleSeverity = exports.RuleType = void 0;
const typeorm_1 = require("typeorm");
const ruleset_entity_1 = require("./ruleset.entity");
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
let Rule = class Rule {
};
exports.Rule = Rule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Rule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ruleset_entity_1.RuleSet, ruleSet => ruleSet.rules),
    (0, typeorm_1.JoinColumn)({ name: 'rule_set_id' }),
    __metadata("design:type", ruleset_entity_1.RuleSet)
], Rule.prototype, "ruleSet", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RuleType,
    }),
    __metadata("design:type", String)
], Rule.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Rule.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RuleSeverity,
    }),
    __metadata("design:type", String)
], Rule.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Rule.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Rule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Rule.prototype, "updatedAt", void 0);
exports.Rule = Rule = __decorate([
    (0, typeorm_1.Entity)('rules')
], Rule);
