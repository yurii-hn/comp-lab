import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  OptimalControlRequestBody,
  OptimalControlSuccessResponse,
  PIRequestBody,
  PISuccessResponse,
  SimulationRequestBody,
  SimulationSuccessResponse,
} from '@core/types/processing';
import { ErrorResponse } from '@core/types/processing/api.types';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ProcessingService {
    private readonly httpClient: HttpClient = inject(HttpClient);

    public simulateModel(
        data: SimulationRequestBody,
    ): Observable<SimulationSuccessResponse | ErrorResponse> {
        return this.httpClient.post<SimulationSuccessResponse | ErrorResponse>(
            'http://localhost:5000/simulate',
            data,
        );
    }

    public optimizeModel(
        data: OptimalControlRequestBody,
    ): Observable<OptimalControlSuccessResponse | ErrorResponse> {
        return this.httpClient.post<
            OptimalControlSuccessResponse | ErrorResponse
        >('http://localhost:5000/optimal-control', data);
    }

    public identifyParameters(
        data: PIRequestBody,
    ): Observable<PISuccessResponse | ErrorResponse> {
        return this.httpClient.post<PISuccessResponse | ErrorResponse>(
            'http://localhost:5000/parameters-identification',
            data,
        );
    }
}
