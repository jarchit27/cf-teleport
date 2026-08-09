import axios from 'axios';
import * as cheerio from 'cheerio';

export interface Problem {
    id: string;
    name: string;
    htmlStatement: string;
}

export async function fetchContest(contestId: string): Promise<Problem[]> {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    };

    const problemUrl = `https://codeforces.com/contest/${contestId}/problem/A`;
    
    try {
        const response = await axios.get(problemUrl, { headers });
        const $ = cheerio.load(response.data);
        
        // Extract the problem title and HTML
        const titleElement = $('.problem-statement .title').first();
        const name = titleElement.text().trim() || "Problem A";
        const problemHtml = $('.problem-statement').parent().html() || $('.problem-statement').html() || `<h2>${name}</h2><p>Could not parse HTML.</p>`;
        
        return [{
            id: 'A',
            name: name,
            htmlStatement: problemHtml
        }];
    } catch (error: any) {
        throw new Error(`Failed to fetch Problem A directly: ${error.message}`);
    }
}
