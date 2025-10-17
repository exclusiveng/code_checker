// import AdmZip from 'adm-zip';
// import axios from 'axios';
// import { RuleInput } from '../utils/validator';

// type ZipEntry = ReturnType<AdmZip['getEntries']>[number]; // Dynamically infer entry type

// export async function evaluateRulesAgainstZip(
//   zipUrl: string,
//   rules: RuleInput[],
// ): Promise<{ findings: any[]; hasErrors: boolean }> {
//   try {
//     // Step 1: Download the zip file
//     const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
//     const zip = new AdmZip(response.data);

//     // Step 2: Extract file entries safely
//     const entries: ZipEntry[] = zip.getEntries().filter((entry) => !entry.isDirectory);

//     const findings: any[] = [];

//     // Step 3: Evaluate each rule against all files
//     for (const rule of rules) {
//       try {
//         switch (rule.type) {
//           case 'filename-contains':
//             for (const entry of entries) {
//               if (entry.entryName.includes(rule.payload)) {
//                 findings.push({
//                   ruleId: rule.id,
//                   severity: rule.severity,
//                   message: rule.message,
//                   file: entry.entryName,
//                 });
//               }
//             }
//             break;

//           case 'file-content-contains':
//             for (const entry of entries) {
//               const content = entry.getData().toString('utf8');
//               if (content.includes(rule.payload)) {
//                 findings.push({
//                   ruleId: rule.id,
//                   severity: rule.severity,
//                   message: rule.message,
//                   file: entry.entryName,
//                 });
//               }
//             }
//             break;

//           default:
//             findings.push({
//               ruleId: rule.id,
//               severity: 'warning',
//               message: `Unknown rule type: ${rule.type}`,
//             });
//         }
//       } catch (ruleErr) {
//         findings.push({
//           ruleId: rule.id,
//           severity: 'error',
//           message: `Error evaluating rule: ${(ruleErr as Error).message}`,
//         });
//       }
//     }

//     // Step 4: Determine whether any errors or failed rules occurred
//     const hasErrors = findings.some((f) => f.severity === 'error');

//     return { findings, hasErrors };
//   } catch (err) {
//     console.error('Failed to evaluate rules against zip:', err);
//     return {
//       findings: [
//         {
//           severity: 'error',
//           message: `Evaluation failed: ${(err as Error).message}`,
//         },
//       ],
//       hasErrors: true,
//     };
//   }
// }
