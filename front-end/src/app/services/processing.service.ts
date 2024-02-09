import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    IOptimalControlRequestData,
    IOptimalControlResponseData,
    ISimulationRequestData,
    ISimulationResponseData
} from '../core/interfaces';

@Injectable({
    providedIn: 'root',
})
export class ProcessingService {
    constructor(private readonly httpClient: HttpClient) {}

    public simulateModel(
        data: ISimulationRequestData
    ): Observable<ISimulationResponseData> {
        return this.httpClient.post<ISimulationResponseData>(
            'http://localhost:5000/simulate',
            data
        );
    }

    public optimizeModel(
        data: IOptimalControlRequestData
    ): Observable<IOptimalControlResponseData> {
        return this.httpClient.post<IOptimalControlResponseData>(
            'http://localhost:5000/optimal-control',
            data
        );
    }
}
