import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ValidationResponse {
    valid: boolean;
    message?: string;
}

@Injectable({
    providedIn: 'root',
})
export class ValidationService {
    private readonly httpClient: HttpClient = inject(HttpClient);

    public expression(
        expression: string,
        allowedSymbols: string[],
    ): Observable<ValidationResponse> {
        return this.httpClient.post<ValidationResponse>(
            'http://localhost:5000/validate-expression',
            {
                expression,
                allowedSymbols,
            },
        );
    }
}
