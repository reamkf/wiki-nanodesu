/**
 * クエリで使用可能なトークンの種類
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
 * クエリを解析して検索条件を生成するパーサー
 */
export class QueryParser {
    private tokens: Token[] = [];
    private currentPosition = 0;

    /**
     * クエリ文字列からパーサーを初期化
     */
    constructor(private queryString: string) {
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
        // トークン分割の前処理
        const rawTokens = this.extractRawTokens();

        // 無効な演算子をWORDに変換
        const validatedTokens = this.validateOperators(rawTokens);

        // 暗黙的なANDトークンを挿入
        this.tokens = this.insertImplicitAnds(validatedTokens);
    }

    /**
     * クエリ文字列から基本的なトークンを抽出
     */
    private extractRawTokens(): Token[] {
        const tokens: Token[] = [];
        let position = 0;
        let i = 0;

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
                tokens.push({
                    type: char === '(' ? TokenType.LEFT_PAREN : TokenType.RIGHT_PAREN,
                    value: char,
                    position
                });
                i++;
                position++;
                continue;
            }

            // NOT演算子(-) の処理
            if (this.isNotOperator(i)) {
                tokens.push({
                    type: TokenType.NOT,
                    value: '-',
                    position
                });
                i++;
                position++;
                continue;
            }

            // 単語の処理
            const wordResult = this.extractWord(i);
            if (wordResult.word) {
                tokens.push(this.createWordToken(wordResult.word, position));
            }

            i = wordResult.newIndex;
            position = position + (wordResult.newIndex - i);
            i = wordResult.newIndex;
        }

        // 括弧のバランスを修正
        return this.balanceParentheses(tokens);
    }

    /**
     * 現在位置のハイフンがNOT演算子かどうかを判定
     */
    private isNotOperator(index: number): boolean {
        if (this.queryString[index] !== '-') return false;

        const isAtStart = index === 0;
        const isPrecededByWhitespaceOrParen = index > 0 &&
            (this.queryString[index - 1] === ' ' ||
             this.queryString[index - 1] === '　' ||
             this.queryString[index - 1] === '(');

        const hasRightOperand = index < this.queryString.length - 1 &&
            this.queryString[index + 1] !== ' ' &&
            this.queryString[index + 1] !== '　' &&
            this.queryString[index + 1] !== '(' &&
            this.queryString[index + 1] !== ')';

        return (isAtStart || isPrecededByWhitespaceOrParen) && hasRightOperand;
    }

    /**
     * 単語を抽出
     */
    private extractWord(startIndex: number): { word: string, newIndex: number } {
        let word = '';
        let i = startIndex;

        while (i < this.queryString.length &&
               this.queryString[i] !== ' ' &&
               this.queryString[i] !== '　' &&
               this.queryString[i] !== '(' &&
               this.queryString[i] !== ')') {
            word += this.queryString[i];
            i++;
        }

        return { word, newIndex: i };
    }

    /**
     * 単語からトークンを作成
     */
    private createWordToken(word: string, position: number): Token {
        const upperWord = word.toUpperCase();

        // ANDかORの場合
        if (upperWord === 'AND' || upperWord === 'OR') {
            return {
                type: upperWord === 'AND' ? TokenType.AND : TokenType.OR,
                value: word.toLowerCase(), // 小文字化
                position
            };
        }

        // 通常の単語は小文字化して格納
        return {
            type: TokenType.WORD,
            value: word.toLowerCase(),
            position
        };
    }

    /**
     * 括弧のバランスを修正
     */
    private balanceParentheses(tokens: Token[]): Token[] {
        // 不正な閉じ括弧をWORDに変換
        const stack: number[] = [];
        const result = tokens.map(token => {
            if (token.type === TokenType.LEFT_PAREN) {
                stack.push(token.position);
                return token;
            } else if (token.type === TokenType.RIGHT_PAREN) {
                if (stack.length === 0) {
                    // 対応する開き括弧がない場合は単語として扱う
                    return {
                        type: TokenType.WORD,
                        value: token.value,
                        position: token.position
                    };
                } else {
                    stack.pop();
                    return token;
                }
            } else {
                return token;
            }
        });

        // 余分な開き括弧をWORDに変換して追加
        return result;
    }

    /**
     * 無効な演算子をWORDに変換
     */
    private validateOperators(tokens: Token[]): Token[] {
        return tokens.map((token, i) => {
            if (token.type === TokenType.AND || token.type === TokenType.OR) {
                // クエリの先頭または末尾にある演算子
                if (i === 0 || i === tokens.length - 1) {
                    return { ...token, type: TokenType.WORD };
                }

                const prev = tokens[i - 1];
                // 左側が別の演算子の場合（括弧は例外）
                if (prev.type === TokenType.AND || prev.type === TokenType.OR ||
                    prev.type === TokenType.NOT || prev.type === TokenType.LEFT_PAREN) {
                    return { ...token, type: TokenType.WORD };
                }
            } else if (token.type === TokenType.NOT) {
                // NOTの後に何もない場合
                if (i === tokens.length - 1) {
                    return { ...token, type: TokenType.WORD };
                }

                const next = tokens[i + 1];
                // NOTの後に演算子または閉じ括弧がある場合
                if (next.type === TokenType.AND || next.type === TokenType.OR ||
                    next.type === TokenType.NOT || next.type === TokenType.RIGHT_PAREN) {
                    return { ...token, type: TokenType.WORD };
                }
            }

            return token;
        });
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
                const needsAnd = this.needsImplicitAnd(current, next);

                if (needsAnd) {
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
     * 二つのトークン間に暗黙的なANDが必要かどうかを判定
     */
    private needsImplicitAnd(current: Token, next: Token): boolean {
        const isCurrentNeedingAnd =
            current.type === TokenType.WORD || current.type === TokenType.RIGHT_PAREN;

        const isNextNeedingAnd =
            next.type === TokenType.NOT ||
            next.type === TokenType.WORD ||
            next.type === TokenType.LEFT_PAREN;

        const notAlreadyHasOperator =
            next.type !== TokenType.OR &&
            next.type !== TokenType.AND;

        return isCurrentNeedingAnd && isNextNeedingAnd && notAlreadyHasOperator;
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

            // 右側のオペランドがない場合
            if (!this.isValidOperandPosition()) {
                return () => false;
            }

            const rightEvaluator = this.parseAndExpression();
            const leftEvaluator = evaluator;
            evaluator = (text: string) => {
                // テキストを1回だけ小文字化
                const lowerText = text.toLowerCase();
                return leftEvaluator(lowerText) || rightEvaluator(lowerText);
            };
        }

        // 最終的な評価関数をラップして、入力テキストを一度だけ小文字化
        const finalEvaluator = evaluator;
        return (text: string) => finalEvaluator(text.toLowerCase());
    }

    /**
     * AND式を解析
     */
    private parseAndExpression(): (text: string) => boolean {
        let evaluator = this.parseNotExpression();

        while (this.getCurrentToken()?.type === TokenType.AND) {
            this.advance();

            // 右側のオペランドがない場合
            if (!this.isValidOperandPosition()) {
                return () => false;
            }

            const rightEvaluator = this.parseNotExpression();
            const leftEvaluator = evaluator;
            // すでに小文字化されたテキストを受け取ることを想定
            evaluator = (text: string) => leftEvaluator(text) && rightEvaluator(text);
        }

        return evaluator;
    }

    /**
     * 現在位置が有効なオペランド位置かチェック
     */
    private isValidOperandPosition(): boolean {
        if (this.currentPosition >= this.tokens.length) {
            return false;
        }

        const token = this.getCurrentToken();
        return !(token?.type === TokenType.RIGHT_PAREN ||
                 token?.type === TokenType.AND ||
                 token?.type === TokenType.OR);
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
                return (text: string) => text.includes(notToken.value);
            }

            const nextToken = this.getCurrentToken();

            // 次のトークンが単語ではない場合は、NOTをテキストとして扱う
            if (!nextToken || nextToken.type !== TokenType.WORD) {
                return (text: string) => text.includes(notToken.value);
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
            return () => false;
        }

        this.advance();

        if (token.type === TokenType.WORD) {
            // トークンの値はすでに小文字化されている
            return (text: string) => text.includes(token.value);
        } else if (token.type === TokenType.LEFT_PAREN) {
            // 括弧内の式を解析
            const savedPosition = this.currentPosition;
            let evaluator;

            try {
                evaluator = this.parseExpression();
            } catch {
                // エラーが発生した場合は開き括弧をテキストとして扱う
                this.currentPosition = savedPosition;
                return (text: string) => text.includes(token.value.toLowerCase());
            }

            // 閉じ括弧があるか確認
            if (this.getCurrentToken()?.type !== TokenType.RIGHT_PAREN) {
                return (text: string) => text.includes(token.value.toLowerCase());
            }

            this.advance();
            return evaluator;
        } else {
            // その他のトークンはテキストとして扱う
            return (text: string) => text.includes(token.value.toLowerCase());
        }
    }
}