import axios from 'axios';

export interface OllamaConfig {
    baseUrl?: string;
    model?: string;
}

export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
}

export interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export const ollamabackend = async (prompt: string, onToken?: (token: string) => void): Promise<string> => {
        const requestBody: OllamaGenerateRequest = {
            model: 'llama3.2:1b',
            prompt: prompt,
            stream: !!onToken
        }

        try {
            const response = await axios.post(
                'http://localhost:11434/api/generate',
                requestBody,
                {
                    responseType: onToken ? 'stream' : 'json',
                    timeout: 60000
                }
            );

            if (!onToken) {
                return response.data.response
            }

            return new Promise((resolve, reject) => {
                let fullResponse = ''
                let buffer = ''

                response.data.on('data', (chunk: Buffer) => {
                    buffer += chunk.toString()
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const parsed: OllamaGenerateResponse = JSON.parse(line);

                                if (parsed.response) {
                                    fullResponse += parsed.response;
                                    onToken(parsed.response);
                                }

                                if (parsed.done) {
                                    resolve(fullResponse);
                                }
                            } catch (error) {
                                console.error('Failed to parse JSON:', error);
                            }
                        }
                    }
                });

                response.data.on('end', () => {
                    if (buffer.trim()) {
                        try {
                            const parsed: OllamaGenerateResponse = JSON.parse(buffer);
                            if (parsed.response) {
                                fullResponse += parsed.response;
                                onToken(parsed.response);
                            }
                        } catch (error) {
                            console.error('Failed to parse final JSON:', error);
                        }
                    }
                    resolve(fullResponse);
                });

                response.data.on('error', (error: Error) => {
                    reject(new Error(`Stream error: ${error.message}`));
                });
            });

        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Ollama request failed: ${error.message}. Is Ollama running?`);
            }
            throw error;
        }
    };