import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    IOptimalControlData,
    IOptimalControlResponse,
    ISimulationData,
    ISimulationResponse,
} from '../core/interfaces';

@Injectable({
    providedIn: 'root',
})
export class SimulationService {
    constructor(private readonly httpClient: HttpClient) {}

    public simulateModel(
        model: ISimulationData
    ): Observable<ISimulationResponse> {
        return this.httpClient.post<ISimulationResponse>(
            'http://localhost:5000/simulate',
            model
        );
    }

    public optimizeModel(
        model: IOptimalControlData
    ): Observable<IOptimalControlResponse> {
        return this.httpClient.post<IOptimalControlResponse>(
            'http://localhost:5000/optimal-control',
            model
        );
    }
}
