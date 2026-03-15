$filePath = 'c:\Users\vikas\OneDrive\Desktop\New folder\app.js'
$content = Get-Content $filePath
$cleanContent = $content[0..2683] # Keep up to line 2684 (0-indexed 2683)
$appendix = @"
mongoose.connect(process.env.MONGO_URL);

function convertNumberToWords(amount) {
    if (amount == 0) return 'Zero Only';
    var words = new Array();
    words[0] = '';
    words[1] = 'One';
    words[2] = 'Two';
    words[3] = 'Three';
    words[4] = 'Four';
    words[5] = 'Five';
    words[6] = 'Six';
    words[7] = 'Seven';
    words[8] = 'Eight';
    words[9] = 'Nine';
    words[10] = 'Ten';
    words[11] = 'Eleven';
    words[12] = 'Twelve';
    words[13] = 'Thirteen';
    words[14] = 'Fourteen';
    words[15] = 'Fifteen';
    words[16] = 'Sixteen';
    words[17] = 'Seventeen';
    words[18] = 'Eighteen';
    words[19] = 'Nineteen';
    words[20] = 'Twenty';
    words[30] = 'Thirty';
    words[40] = 'Forty';
    words[50] = 'Fifty';
    words[60] = 'Sixty';
    words[70] = 'Seventy';
    words[80] = 'Eighty';
    words[90] = 'Ninety';

    amount = amount.toString();
    var atemp = amount.split('.');
    var number = atemp[0].split(',').join('');
    var n_after_dot = atemp[1] ? atemp[1] : '00';
    var n_length = number.length;
    var words_string = '';
    if (n_length <= 9) {
        var n_array = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
        var received_n_array = new Array();
        for (var i = 0; i < n_length; i++) {
            received_n_array[i] = number.substr(i, 1);
        }
        for (var i = 9 - n_length, j = 0; i < 9; i++, j++) {
            n_array[i] = received_n_array[j];
        }
        for (var i = 0, j = 1; i < 9; i++, j++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                if (n_array[i] == 1) {
                    n_array[j] = 10 + parseInt(n_array[j]);
                    n_array[i] = 0;
                }
            }
        }
        var val = '';
        for (var i = 0; i < 9; i++) {
            if (i == 0 || i == 2 || i == 4 || i == 7) {
                val = n_array[i] * 10;
            } else {
                val = n_array[i];
            }
            if (val != 0) {
                words_string += words[val] + ' ';
            }
            if ((i == 1 && val != 0) || (i == 0 && val != 0 && n_array[i + 1] == 0)) {
                words_string += 'Crores ';
            }
            if ((i == 3 && val != 0) || (i == 2 && val != 0 && n_array[i + 1] == 0)) {
                words_string += 'Lakhs ';
            }
            if ((i == 5 && val != 0) || (i == 4 && val != 0 && n_array[i + 1] == 0)) {
                words_string += 'Thousand ';
            }
            if (i == 6 && val != 0 && (n_array[i + 1] != 0 && n_array[i + 2] != 0)) {
                words_string += 'Hundred and ';
            } else if (i == 6 && val != 0) {
                words_string += 'Hundred ';
            }
        }
        words_string = words_string.split('  ').join(' ');
    }

    let paise_string = '';
    if (parseInt(n_after_dot) > 0) {
        if (n_after_dot.length == 1) n_after_dot += '0';
        if (n_after_dot.length > 2) n_after_dot = n_after_dot.substring(0, 2);

        var p_num = parseInt(n_after_dot);
        if (p_num > 0) {
            paise_string = ' and Paise ';
            if (p_num < 20) {
                paise_string += words[p_num];
            } else {
                paise_string += words[Math.floor(p_num / 10) * 10] + ' ' + (words[p_num % 10] || '');
            }
        }
    }

    return words_string.trim() + paise_string + ' Only';
}
"@
$finalContent = $cleanContent + $appendix
$finalContent | Out-File -FilePath $filePath -Encoding utf8 -NoNewline
