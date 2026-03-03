export function numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = Math.floor(num);
    if (n === 0) return 'Zero';

    function makeWords(n: number): string {
        let str = '';
        if (n > 19) {
            str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
        } else {
            str += a[n];
        }
        return str;
    }

    let result = '';
    const crores = Math.floor(n / 10000000);
    const lakhs = Math.floor((n % 10000000) / 100000);
    const thousands = Math.floor((n % 100000) / 1000);
    const hundreds = Math.floor((n % 1000) / 100);
    const remaining = n % 100;

    if (crores > 0) result += makeWords(crores) + 'Crore ';
    if (lakhs > 0) result += makeWords(lakhs) + 'Lakh ';
    if (thousands > 0) result += makeWords(thousands) + 'Thousand ';
    if (hundreds > 0) result += makeWords(hundreds) + 'Hundred ';
    if (remaining > 0) {
        if (result !== '') result += 'and ';
        result += makeWords(remaining);
    }

    return result.trim() + ' Only';
}
