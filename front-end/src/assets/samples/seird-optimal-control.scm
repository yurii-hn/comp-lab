{
    "compartments": [
        {
            "id": "39834017-9dc2-44f2-990f-3ab974d9f923",
            "name": "S",
            "value": 325595940
        },
        {
            "id": "fdb38bf8-fc44-44e4-aec2-1b6518c93a5c",
            "name": "E",
            "value": 4497300
        },
        {
            "id": "4da3c076-5d82-463d-b249-e1135a2a05eb",
            "name": "I",
            "value": 242694
        },
        {
            "id": "82ea3225-63fe-42f2-bced-fa26c453433e",
            "name": "R",
            "value": 318920
        },
        {
            "id": "fe05edfa-c032-40aa-966c-2a7c8547f5d8",
            "name": "D",
            "value": 5146
        }
    ],
    "constants": [
        {
            "name": "beta",
            "value": 0.0101,
            "id": "50487db4-3e0d-4046-b619-247fc3399958"
        },
        {
            "name": "gamma",
            "value": 0.16,
            "id": "86ed85ac-ca7c-4d36-b7cb-fa1c80c82ec6"
        },
        {
            "name": "mu",
            "value": 0.9818,
            "id": "fe6b343f-a8e7-484a-8361-c270cf89d4ff"
        },
        {
            "name": "rho",
            "value": 0.01818,
            "id": "7a7ffc1a-8fe4-41d8-9b16-fdaf7c79f3cd"
        },
        {
            "name": "N",
            "value": 330660000,
            "id": "5755f40f-6ef9-4da2-b1a7-8807f3532c3a"
        },
        {
            "name": "A",
            "value": 0.5,
            "id": "926af609-30d3-43a2-8b90-722c5743245a"
        },
        {
            "name": "B",
            "value": 0.5,
            "id": "9afb6746-d853-4a6d-b0d4-adc26146b01b"
        }
    ],
    "interventions": [
        {
            "name": "q",
            "id": "65cf811a-82ed-4dbd-ac9d-5810d096d27b"
        },
        {
            "name": "z",
            "id": "105d3964-bc8f-4600-9257-f2b7013df6ee"
        }
    ],
    "flows": [
        {
            "id": "5e14b7e3-a0cb-414b-93ed-20a5ea99ba20",
            "equation": "beta*S*I/N",
            "source": "39834017-9dc2-44f2-990f-3ab974d9f923",
            "target": "fdb38bf8-fc44-44e4-aec2-1b6518c93a5c"
        },
        {
            "id": "bd223f70-138d-4d3f-bcb2-cb93f6a08b5a",
            "equation": "gamma*E",
            "source": "fdb38bf8-fc44-44e4-aec2-1b6518c93a5c",
            "target": "4da3c076-5d82-463d-b249-e1135a2a05eb"
        },
        {
            "id": "abfdbc84-33fb-4a7b-9278-2e92aba108f7",
            "equation": "mu*I",
            "source": "4da3c076-5d82-463d-b249-e1135a2a05eb",
            "target": "82ea3225-63fe-42f2-bced-fa26c453433e"
        },
        {
            "id": "760adff6-8dda-4152-a307-0fbec75b1075",
            "equation": "rho*I",
            "source": "4da3c076-5d82-463d-b249-e1135a2a05eb",
            "target": "fe05edfa-c032-40aa-966c-2a7c8547f5d8"
        },
        {
            "id": "29553b3e-0bc4-4539-a4c2-7143f1f25d0c",
            "equation": "q*E",
            "source": "fdb38bf8-fc44-44e4-aec2-1b6518c93a5c",
            "target": "82ea3225-63fe-42f2-bced-fa26c453433e"
        },
        {
            "id": "2724652c-6ac6-425e-8ae3-383ca3b3e021",
            "equation": "z*I",
            "source": "4da3c076-5d82-463d-b249-e1135a2a05eb",
            "target": "82ea3225-63fe-42f2-bced-fa26c453433e"
        }
    ]
}