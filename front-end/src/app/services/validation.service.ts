import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IValidationResponse } from '../core/interfaces';

@Injectable({
    providedIn: 'root',
})
export class ValidationService {
    constructor(private readonly httpClient: HttpClient) {}

    public validateEquation(
        expression: string,
        allowedSymbols: string[]
    ): Observable<IValidationResponse> {
        return this.httpClient.post<IValidationResponse>(
            'http://localhost:5000/validateExpression',
            {
                expression,
                allowedSymbols,
            }
        );
    }

    public validateCostFunction(
        func: string,
        allowedSymbols: string[],
        interventions: string[]
    ): Observable<IValidationResponse> {
        // return this.httpClient.post<IValidationResponse>(
        //     'http://localhost:5000/validateCostFunction',
        //     {
        //         func,
        //         allowedSymbols,
        //         interventions,
        //     }
        // );

        return of({
            isValid: true,
            message: '',
        });
    }
}
