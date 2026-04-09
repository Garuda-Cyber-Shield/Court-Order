const fs = require('fs');

let content = fs.readFileSync('src/data/countryData.ts', 'utf8');

// Replace directive times
content = content.replace(/directiveTimeNormal:\s*".*?",/g, 'directiveTimeNormal: "72 Hours",');
content = content.replace(/directiveTimeUrgent:\s*".*?",/g, 'directiveTimeUrgent: "48 Hours",');
content = content.replace(/directiveTimeCritical:\s*".*?",/g, 'directiveTimeCritical: "24 Hours",');

// Replace orderTitleText capturing its key to be safe
content = content.replace(/orderTitleText:\s*".*?",/g, 'orderTitleText: "CONTENT REMOVAL ORDER — Social Media Post",');

// Replace departmentName with departmentNameEn
content = content.replace(/departmentName:\s*".*?",\s*departmentNameEn:\s*"(.*?)",/g, 'departmentName: "$1",\n    departmentNameEn: "$1",');

// Replace orderBodyText extracting the English part if wrapped in parentheses
content = content.replace(/orderBodyText:\s*"(.*?)",/g, (match, bodyStr) => {
    const enMatch = bodyStr.match(/\((Under [^)]+)\)/i) || 
                    bodyStr.match(/\((Pursuant to [^)]+)\)/i) ||
                    bodyStr.match(/\((IN ACCORDANCE WITH [^)]+)\)/i) ||
                    bodyStr.match(/\((Under [^\\]+)\)/i);
    
    if (enMatch && enMatch[1]) {
        return `orderBodyText: "${enMatch[1]}.",`;
    } else {
        return `orderBodyText: "Under the relevant cyber laws and provisions, the following Facebook post is hereby ordered to be removed. All platform operators and concerned parties must comply immediately.",`;
    }
});

// For legal refs array, parse only Strings after "legalRefs: [" up to "]"
content = content.replace(/legalRefs:\s*\[([\s\S]*?)\]/g, (match, arrayContent) => {
    let newArray = arrayContent.replace(/"([^"]*?)\(([^)]+)\)([^"]*?)"/g, (m, pre, inParens, post) => {
        const nonAscii = /[^\x00-\x7F]/;
        if (nonAscii.test(pre) || nonAscii.test(post)) {
            return `"${inParens.trim()}"`;
        }
        return m;
    });

    // Strip purely non-ASCII array elements
    newArray = newArray.replace(/"([^"]+)"/g, (m, text) => {
        if (/^[^\x00-\x7F]+$/.test(text)) {
            return `"National Cyber Security Law"`;
        }
        return m;
    });
    
    return `legalRefs: [${newArray}]`;
});

// Also replace seal texts if they have non-ASCII
const nonAsciiGlobal = /[^\x00-\x7F]/;

content = content.replace(/sealTopText:\s*"([^"]+)",/g, (match, text) => {
    if (nonAsciiGlobal.test(text)) return `sealTopText: "CYBER CRIME DIVISION",`;
    return match;
});

content = content.replace(/sealBottomText:\s*"([^"]+)",/g, (match, text) => {
    if (nonAsciiGlobal.test(text)) return `sealBottomText: "★ OFFICIAL SEAL ★",`;
    return match;
});

content = content.replace(/sealCenterText:\s*"([^"]+)",/g, (match, text) => {
    if (nonAsciiGlobal.test(text)) return `sealCenterText: "LAW",`;
    return match;
});

content = content.replace(/governmentNameLine1:\s*"([^"]+)",/g, (match, text) => {
    if (nonAsciiGlobal.test(text)) return `governmentNameLine1: "Government Authorities",`;
    return match;
});

content = content.replace(/governmentNameLine2:\s*"([^"]+)",/g, (match, text) => {
    if (nonAsciiGlobal.test(text)) return `governmentNameLine2: "DEPARTMENT OF CYBER SECURITY",`;
    return match;
});

// Also replace officerDesignation
content = content.replace(/officerDesignation:\s*"([^"]+)",/g, (match, text) => {
    if (nonAsciiGlobal.test(text)) return `officerDesignation: "Authorized Officer",`;
    return match;
});

// Also replace officerName
content = content.replace(/officerName:\s*"([^"]+)",/g, (match, text) => {
    if (nonAsciiGlobal.test(text)) {
        // Find English transliteration if present like "Name (English)"
        const enMatch = text.match(/\(([^)]+)\)/);
        if (enMatch && enMatch[1]) return `officerName: "${enMatch[1]}",`;
        return `officerName: "Authorized Officer",`;
    }
    return match;
});

content = content.replace(/signatureText:\s*"([^"]+)",/g, (match, text) => {
    if (nonAsciiGlobal.test(text)) {
        const enMatch = text.match(/\(([^)]+)\)/);
        if (enMatch && enMatch[1]) return `signatureText: "${enMatch[1]}",`;
        return `signatureText: "Authorized Officer",`;
    }
    return match;
});


fs.writeFileSync('src/data/countryData.ts', content, 'utf8');
console.log("English translation update completed!");
