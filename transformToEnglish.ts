import * as fs from 'fs';

let content = fs.readFileSync('src/data/countryData.ts', 'utf8');

// Replace directive times
content = content.replace(/directiveTimeNormal:\s*".*?",/g, 'directiveTimeNormal: "72 Hours",');
content = content.replace(/directiveTimeUrgent:\s*".*?",/g, 'directiveTimeUrgent: "48 Hours",');
content = content.replace(/directiveTimeCritical:\s*".*?",/g, 'directiveTimeCritical: "24 Hours",');

// Replace orderTitleText
content = content.replace(/orderTitleText:\s*".*?",/g, 'orderTitleText: "CONTENT REMOVAL ORDER — Social Media Post",');

// Replace departmentName with departmentNameEn
content = content.replace(/departmentName:\s*".*?",\s*departmentNameEn:\s*"(.*?)",/g, 'departmentName: "$1",\n    departmentNameEn: "$1",');

// Replace orderBodyText extracting the English part if wrapped in parentheses
content = content.replace(/orderBodyText:\s*"(.*?)",/g, (match, bodyStr) => {
    // try to find "(Under ...)" or "(Pursuant to ...)"
    const enMatch = bodyStr.match(/\((Under [^)]+)\)/i) || 
                    bodyStr.match(/\((Pursuant to [^)]+)\)/i) ||
                    bodyStr.match(/\((IN ACCORDANCE WITH [^)]+)\)/i) ||
                    bodyStr.match(/\((Under [^\\]+)\)/i);
    
    if (enMatch && enMatch[1]) {
        // Return exactly the English string
        return `orderBodyText: "${enMatch[1]}.",`;
    } else {
        // generic fallback if no English translation was in parentheses
        return `orderBodyText: "Under the relevant cyber laws and provisions, the following Facebook post is hereby ordered to be removed. All platform operators and concerned parties must comply immediately.",`;
    }
});

// For legal refs, let's keep them as they are, except strip out non-english prefixes if they are just translations.
// Wait, legal refs are in an array:
// legalRefs: [ "Національної Поліції (National Police Act)", ... ]
// We can use a regex to replace non-ASCII characters from strings, OR just keep them since Laws are proper nouns.
// Actually the user said "legal laws language English... no other language".
// Let's strip out anything inside quotes that has Cyrillic/Arabic/etc if there's English in parens.
content = content.replace(/"([^"]*?)\(([^)]+)\)([^"]*?)"/g, (match, pre, inParens, post) => {
    // If the part outside parens has non-ASCII, and the part inside is mostly ASCII, use the inside part
    const nonAscii = /[^\x00-\x7F]/;
    if (nonAscii.test(pre) || nonAscii.test(post)) {
        return `"${inParens.trim()}"`;
    }
    return match;
});

// Also replace seal texts if they have non-ASCII
content = content.replace(/sealTopText:\s*"([^"]+)",/g, (match, text) => {
    if (/[^\x00-\x7F]/.test(text)) {
        return `sealTopText: "CYBER CRIME DIVISION",`;
    }
    return match;
});

content = content.replace(/sealBottomText:\s*"([^"]+)",/g, (match, text) => {
    if (/[^\x00-\x7F]/.test(text)) {
        return `sealBottomText: "★ OFFICIAL SEAL ★",`;
    }
    return match;
});

// For governmentNameLine1, governmentNameLine2:
content = content.replace(/governmentNameLine1:\s*"([^"]+)",/g, (match, text) => {
    if (/[^\x00-\x7F]/.test(text)) {
        return `governmentNameLine1: "Government Authorities",`;
    }
    return match;
});

content = content.replace(/governmentNameLine2:\s*"([^"]+)",/g, (match, text) => {
    if (/[^\x00-\x7F]/.test(text)) {
        return `governmentNameLine2: "DEPARTMENT OF CYBER SECURITY",`;
    }
    return match;
});

// Remove any remaining non-ASCII from legalRefs strings explicitly
content = content.replace(/"([^"]+)"/g, (match, text) => {
    // If it's a legal ref or string that is entirely non-ASCII, replace with "National Cyber Law"
    if (/^[^\x00-\x7F]+$/.test(text)) {
        return `"National Cyber Security Law"`;
    }
    return match;
});


fs.writeFileSync('src/data/countryData.ts', content, 'utf8');
console.log("English translation update completed!");
