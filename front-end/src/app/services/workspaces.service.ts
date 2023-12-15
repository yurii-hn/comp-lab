import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IWorkspace, IWorkspaceBase } from '../core/interfaces';

@Injectable({
    providedIn: 'root',
})
export class WorkspacesService {
    private readonly workspaces: IWorkspace[] = [];
    private readonly currentWorkspaceNameSubject: BehaviorSubject<string> =
        new BehaviorSubject<string>('');

    public readonly currentWorkspaceName$: Observable<string> =
        this.currentWorkspaceNameSubject.asObservable();

    public get currentWorkspaceName(): string {
        return this.currentWorkspaceNameSubject.value;
    }

    public addWorkspace(workspace: IWorkspaceBase): string {
        const workspaceName = `Workspace ${this.workspaces.length + 1}`;

        if (this.workspaces.length === 0) {
            this.currentWorkspaceNameSubject.next(workspaceName);
        }

        this.workspaces.push({
            name: workspaceName,
            ...workspace,
        });

        return workspaceName;
    }

    public updateWorkspace(
        workspaceName: string,
        workspace: IWorkspaceBase
    ): void {
        const workspaceIndex: number = this.workspaces.findIndex(
            (workspace: IWorkspace): boolean => workspace.name === workspaceName
        );

        this.workspaces[workspaceIndex] = {
            name: workspaceName,
            ...workspace,
        };
    }

    public setCurrentWorkspace(workspaceName: string): void {
        this.currentWorkspaceNameSubject.next(workspaceName);
    }

    public getWorkspace(workspaceName: string): IWorkspace {
        return this.workspaces.find(
            (workspace: IWorkspace): boolean => workspace.name === workspaceName
        ) as IWorkspace;
    }

    public removeWorkspace(workspaceName: string): void {
        const workspaceIndex: number = this.workspaces.findIndex(
            (workspace: IWorkspace): boolean => workspace.name === workspaceName
        );

        this.workspaces.splice(workspaceIndex, 1);

        this.updateWorkspaceNames();

        if (this.currentWorkspaceName === workspaceName) {
            this.currentWorkspaceNameSubject.next(
                this.workspaces[Math.max(workspaceIndex - 1, 0)].name
            );
        }
    }

    public getWorkspaceNames(): string[] {
        return this.workspaces.map(
            (workspace: IWorkspace): string => workspace.name
        );
    }

    private updateWorkspaceNames(): void {
        this.workspaces.forEach(
            (workspace: IWorkspace, index: number): void => {
                workspace.name = `Workspace ${index + 1}`;
            }
        );
    }
}
