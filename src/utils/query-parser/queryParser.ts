/**
 * クエリで使用可能なトークンの種類を定義
 */
export enum TokenType {
    WORD = 'WORD',
    AND = 'AND',
    OR = 'OR',
    NOT = 'NOT',
    LEFT_PAREN = 'LEFT_PAREN',
    RIGHT_PAREN = 'RIGHT_PAREN'
}

/**
 * クエリを構成する個々のトークン
 */
export interface Token {
    type: TokenType;
    value: string;
    position: number;
}

/**
 * パース処理中に発生するエラー
 */
export class QueryParseError extends Error {
    constructor(message: string, public position: number) {
        super(`${message} at position ${position}`);
        this.name = 'QueryParseError';
    }
}

/**
 * クエリを解析して検索条件を生成するパーサー
 */
export class QueryParser {
    private tokens: Token[] = [];
    private currentPosition = 0;
    private originalQuery: string;

    /**
     * クエリ文字列からパーサーを初期化
     */
    constructor(private queryString: string) {
        this.originalQuery = queryString;
        this.tokenize();
    }

    /**
     * クエリ文字列を解析して判定関数を返す
     */
    public parse(): (text: string) => boolean {
        this.currentPosition = 0;
        return this.parseExpression();
    }

    /**
     * クエリ文字列をトークンに分割
     */
    private tokenize(): void {
        const tokens: Token[] = [];
        let position = 0;
        let i = 0;
        const parenStack: number[] = [];

        while (i < this.queryString.length) {
            const char = this.queryString[i];

            // 空白をスキップ
            if (char === ' ' || char === '　') {
                i++;
                position++;
                continue;
            }

            // 括弧の処理
            if (char === '(' || char === ')') {
                if (char === '(') {
                    parenStack.push(position);
                    tokens.push({
                        type: TokenType.LEFT_PAREN,
                        value: char,
                        position
                    });
                } else { // char === ')'
                    if (parenStack.length === 0) {
                        // 開きカッコがない閉じカッコを検出
                        // エラーをスローする代わりに、閉じカッコをテキストとして扱う
                        tokens.push({
                            type: TokenType.WORD,
                            value: char,
                            position
                        });
                    } else {
                        parenStack.pop();
                        tokens.push({
                            type: TokenType.RIGHT_PAREN,
                            value: char,
                            position
                        });
                    }
                }
                i++;
                position++;
                continue;
            }

            // NOT演算子(-) の処理
            // ハイフンは、クエリの先頭、空白の後、または開きカッコの後の場合のみNOT演算子として扱う
            // それ以外の場合はハイフンを含む単語として処理する
            if (char === '-' && (i === 0 || this.queryString[i - 1] === ' ' || this.queryString[i - 1] === '　' || this.queryString[i - 1] === '(')) {
                // 次のトークンがある場合のみNOT演算子として扱う
                if (i < this.queryString.length - 1 &&
                    this.queryString[i + 1] !== ' ' &&
                    this.queryString[i + 1] !== '　' &&
                    this.queryString[i + 1] !== '(' &&
                    this.queryString[i + 1] !== ')') {
                    tokens.push({
                        type: TokenType.NOT,
                        value: '-',
                        position
                    });
                    i++;
                    position++;
                    continue;
                } else {
                    // 単語として処理するためにここではスキップしない
                }
            }

            // 単語の処理（ハイフンを含む）
            let word = '';
            const startPos = position;

            // ハイフンが演算子ではなく単語の一部として扱われる場合も考慮
            let includesHyphen = false;
            let isFirstChar = true;

            while (i < this.queryString.length &&
                  this.queryString[i] !== ' ' &&
                  this.queryString[i] !== '　' &&
                  this.queryString[i] !== '(' &&
                  this.queryString[i] !== ')') {

                // ハイフンの処理
                if (this.queryString[i] === '-') {
                    // 単語の先頭以外のハイフンは単語の一部として扱う
                    // または、単語の先頭でも先頭文字の場合は単語として扱う
                    if (!isFirstChar) {
                        includesHyphen = true;
                        word += '-';
                    } else {
                        // この場合は、ハイフンはNOT演算子ではなく単語の先頭の文字
                        includesHyphen = true;
                        word += '-';
                    }
                } else {
                    word += this.queryString[i];
                }

                isFirstChar = false;
                i++;
                position++;
            }

            if (word) {
                const upperWord = word.toUpperCase();
                // ハイフンを含む場合は常に単語として扱う
                if ((upperWord === 'AND' || upperWord === 'OR') && !includesHyphen) {
                    tokens.push({
                        type: upperWord === 'AND' ? TokenType.AND : TokenType.OR,
                        value: word,
                        position: startPos
                    });
                } else {
                    tokens.push({
                        type: TokenType.WORD,
                        value: word,
                        position: startPos
                    });
                }
            }
        }

        // 最終的に開きカッコが残っていた場合はエラー
        if (parenStack.length > 0) {
            // エラーをスローする代わりに、残りの開きカッコをすべてテキストとして扱う
            for (const pos of parenStack) {
                tokens.push({
                    type: TokenType.WORD,
                    value: '(',
                    position: pos
                });
            }
        }

        // 無効な演算子をチェック（隣接するトークンの組み合わせを確認）
        this.tokens = this.validateOperators(tokens);

        // 暗黙的なANDトークンを挿入
        this.tokens = this.insertImplicitAnds(this.tokens);
    }

    /**
    * 無効な演算子をWORDに変換
    */
    private validateOperators(tokens: Token[]): Token[] {
        const result: Token[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            let convertToWord = false;

            // 演算子の場合、左右のオペランドの有無をチェック
            if (token.type === TokenType.AND || token.type === TokenType.OR) {
                // クエリの先頭または末尾にある演算子
                if (i === 0 || i === tokens.length - 1) {
                    convertToWord = true;
                } else {
                    const prev = tokens[i - 1];

                    // 左側が別の演算子の場合（括弧は例外）
                    if (prev.type === TokenType.AND || prev.type === TokenType.OR ||
                        prev.type === TokenType.NOT || prev.type === TokenType.LEFT_PAREN) {
                        convertToWord = true;
                    }
                }
            } else if (token.type === TokenType.NOT) {
                // NOTの後に何もない場合
                if (i === tokens.length - 1) {
                    convertToWord = true;
                } else {
                    const next = tokens[i + 1];
                    // NOTの後に演算子または閉じ括弧がある場合
                    if (next.type === TokenType.AND || next.type === TokenType.OR ||
                    next.type === TokenType.NOT || next.type === TokenType.RIGHT_PAREN) {
                        convertToWord = true;
                    }
                }
            }

            if (convertToWord) {
                result.push({
                    type: TokenType.WORD,
                    value: token.value,
                    position: token.position
                });
            } else {
                result.push(token);
            }
        }

        return result;
    }

    /**
     * 暗黙的なANDトークンを挿入
     */
    private insertImplicitAnds(tokens: Token[]): Token[] {
        const result: Token[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const current = tokens[i];
            result.push(current);

            if (i < tokens.length - 1) {
                const next = tokens[i + 1];
                const needsAnd =
                    // 現在のトークンが単語で、次がNOTまたは単語または左括弧の場合
                    (current.type === TokenType.WORD &&
                        (next.type === TokenType.NOT ||
                         next.type === TokenType.WORD ||
                         next.type === TokenType.LEFT_PAREN)) ||
                    // 現在のトークンが右括弧で、次がNOTまたは単語または左括弧の場合
                    (current.type === TokenType.RIGHT_PAREN &&
                        (next.type === TokenType.NOT ||
                         next.type === TokenType.WORD ||
                         next.type === TokenType.LEFT_PAREN));

                if (needsAnd &&
                    next.type !== TokenType.OR &&
                    next.type !== TokenType.AND) {
                    result.push({
                        type: TokenType.AND,
                        value: 'AND',
                        position: current.position + current.value.length
                    });
                }
            }
        }

        return result;
    }

    /**
     * 現在のトークンを取得
     */
    private getCurrentToken(): Token | null {
        return this.currentPosition < this.tokens.length
            ? this.tokens[this.currentPosition]
            : null;
    }

    /**
     * トークンを1つ進める
     */
    private advance(): void {
        this.currentPosition++;
    }

    /**
     * クエリ式全体を解析
     */
    private parseExpression(): (text: string) => boolean {
        let evaluator = this.parseAndExpression();

        while (this.getCurrentToken()?.type === TokenType.OR) {
            this.advance();

            // ORの右側のオペランドがない場合
            if (this.currentPosition >= this.tokens.length) {
                return () => false;
            }

            // 次のトークンを確認
            const nextToken = this.getCurrentToken();

            // 次のトークンが閉じ括弧の場合
            if (nextToken && nextToken.type === TokenType.RIGHT_PAREN) {
                return () => false;
            }

            // 次のトークンが演算子の場合（AND/OR）
            if (nextToken && (nextToken.type === TokenType.AND || nextToken.type === TokenType.OR)) {
                return () => false;
            }

            const rightEvaluator = this.parseAndExpression();
            const leftEvaluator = evaluator;
            evaluator = (text: string) => leftEvaluator(text) || rightEvaluator(text);
        }

        return evaluator;
    }

    /**
     * AND式を解析
     */
    private parseAndExpression(): (text: string) => boolean {
        let evaluator = this.parseNotExpression();

        while (this.getCurrentToken()?.type === TokenType.AND) {
            this.advance();

            // ANDの右側のオペランドがない場合
            if (this.currentPosition >= this.tokens.length) {
                return () => false;
            }

            // 次のトークンを確認
            const nextToken = this.getCurrentToken();

            // 次のトークンが閉じ括弧の場合
            if (nextToken && nextToken.type === TokenType.RIGHT_PAREN) {
                return () => false;
            }

            // 次のトークンが演算子の場合（AND/OR）
            if (nextToken && (nextToken.type === TokenType.AND || nextToken.type === TokenType.OR)) {
                return () => false;
            }

            const rightEvaluator = this.parseNotExpression();
            const leftEvaluator = evaluator;
            evaluator = (text: string) => leftEvaluator(text) && rightEvaluator(text);
        }

        return evaluator;
    }

    /**
     * NOT式を解析
     */
    private parseNotExpression(): (text: string) => boolean {
        if (this.getCurrentToken()?.type === TokenType.NOT) {
            const notToken = this.getCurrentToken()!;
            this.advance();

            // NOTの後にオペランドがない場合
            if (this.currentPosition >= this.tokens.length) {
                // NOTをテキストとして扱う
                return (text: string) => this.caseInsensitiveIncludes(text, notToken.value);
            }

            // 次のトークンを確認
            const nextToken = this.getCurrentToken();

            // 次のトークンが単語ではない場合は、NOTをテキストとして扱う
            if (!nextToken || nextToken.type !== TokenType.WORD) {
                return (text: string) => this.caseInsensitiveIncludes(text, notToken.value);
            }

            const operandEvaluator = this.parsePrimary();
            return (text: string) => !operandEvaluator(text);
        }
        return this.parsePrimary();
    }

    /**
     * 基本式（単語またはカッコで囲まれた式）を解析
     */
    private parsePrimary(): (text: string) => boolean {
        const token = this.getCurrentToken();

        if (!token) {
            // エラーをスローする代わりに、空の文字列を検索する関数を返す
            // これは常にfalseを返すので、検索結果には影響しない
            return (text: string) => text.includes('');
        }

        this.advance();

        switch (token.type) {
            case TokenType.WORD:
                // 大文字小文字を区別せずに検索
                return (text: string) => this.caseInsensitiveIncludes(text, token.value);

            case TokenType.LEFT_PAREN: {
                // 安全にパースを試みる
                const savedPosition = this.currentPosition;
                let evaluator;

                try {
                    evaluator = this.parseExpression();
                } catch {
                    // パース中にエラーが発生した場合、位置を元に戻して開き括弧をテキストとして扱う
                    this.currentPosition = savedPosition;
                    return (text: string) => this.caseInsensitiveIncludes(text, token.value);
                }

                const nextToken = this.getCurrentToken();

                if (nextToken?.type !== TokenType.RIGHT_PAREN) {
                    // 閉じ括弧がない場合は、開き括弧をテキストとして扱う
                    return (text: string) => this.caseInsensitiveIncludes(text, token.value);
                }

                this.advance();
                return evaluator;
            }

            default:
                // その他のトークンはテキストとして扱う
                return (text: string) => this.caseInsensitiveIncludes(text, token.value);
        }
    }

    /**
     * 大文字小文字を区別せずに文字列が含まれるかどうかを判定
     */
    private caseInsensitiveIncludes(text: string, value: string): boolean {
        const lowerText = text.toLowerCase();
        const lowerValue = value.toLowerCase();
        return lowerText.includes(lowerValue);
    }
}