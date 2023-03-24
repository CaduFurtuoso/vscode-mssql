///<reference types="cypress"/>

import loc from '../../support/locators'
import '../../support/commandsContas'
import buildEnv from '../../support/buildEnv'

describe('Should test at a functional level', () => {
    after(() => {
        cy.clearLocalStorage()
    })

    beforeEach(() => {
        buildEnv()
        cy.login('cadu.furtuoso@gmail.com', 'caducg1234')
        cy.get(loc.MENU.HOME).click()
            //cy.resetApp()
    })

    it('Should create an account', () => {
        cy.intercept('POST', '/contas', {
            id: 3,
            nome: 'Conta de teste',
            visivel: true,
            usuario_id: 1
        }).as('saveConta')

        cy.acessarMenuConta()

        cy.intercept({
            method: 'GET',
            url: '/contas'
        }, [{
                id: 1,
                nome: 'Carteira',
                visivel: true,
                usuario_id: 1
            },
            {
                id: 2,
                nome: 'Banco',
                visivel: true,
                usuario_id: 1
            },
            {
                id: 3,
                nome: 'Conta de teste',
                visivel: true,
                usuario_id: 1
            }
        ]).as('contasSave')

        cy.inserirConta('Conta de teste')
        cy.get(loc.MESSAGE).should('contain', 'Conta inserida com sucesso!')
    })

    it('Should update an account', () => {
        cy.intercept('PUT', '/contas/**', {
            id: 1,
            nome: 'Banco',
            visivel: true,
            usuario_id: 1
        })

        cy.acessarMenuConta()
        cy.xpath(loc.CONTAS.FN_XP_BTN_ALTERAR('Banco')).click()
        cy.get(loc.CONTAS.NOME).clear().type('Conta atualizada')
        cy.get(loc.CONTAS.BTN_SALVAR).click()
        cy.get(loc.MESSAGE).should('contain', 'Conta atualizada com sucesso!')
    })

    it('Should not create an account with same name', () => {
        cy.intercept('PUT', '/contas', {
            error: 'Já existe uma conta com mesmo nome!',
            status: 401
        }).as('saveContaMesmoNome')

        cy.acessarMenuConta()
        cy.inserirConta('Conta mesmo nome')
        cy.get(loc.MESSAGE).should('contain', 401)
    })

    it('Should create a transaction', () => {
        cy.intercept({
            method: 'POST',
            url: '/transacoes',
        }, [{
            id: 1558284,
            descricao: 'Desc ',
            envolvido: 'inter',
            observacao: null,
            tipo: 'REC',
            data_transacao: '2023-03-23T03:00:00.000Z',
            data_pagamento: '2023-03-23T03:00:00.000Z',
            valor: '123.00',
            status: true,
            conta_id: 1665708,
            usuario_id: 35892,
            transferencia_id: null,
            parcelamento_id: null
        }])

        cy.intercept('GET', '/extrato/**', { fixture: 'movimentacaoSalva' })

        cy.get(loc.MENU.MOVIMENTACAO).click()
        cy.get(loc.MOVIMENTACAO.DESCRICAO).type('Desc')
        cy.get(loc.MOVIMENTACAO.VALOR).type(123)
        cy.get(loc.MOVIMENTACAO.INTERESSADO).type('inter')
        cy.get(loc.MOVIMENTACAO.CONTA).select('Banco')
        cy.get(loc.MOVIMENTACAO.STATUS).click()
        cy.get(loc.MOVIMENTACAO.BTN_MOVIM).click()
        cy.get(loc.MESSAGE).should('contain', 'sucesso')

        cy.get(loc.EXTRATO.LINHAS).should('have.length', 7)
        cy.xpath(loc.EXTRATO.FN_XP_BUSCA_ELEMENTO('Desc', '123')).should('exist')
    })

    it('Should get balance', () => {
        cy.intercept({
            method: 'GET',
            url: '/transacoes/**'
        }, [{
            "conta": "Conta para saldo",
            "id": 1558262,
            "descricao": "Movimentacao 1, calculo saldo",
            "envolvido": "CCC",
            "observacao": null,
            "tipo": "REC",
            "data_transacao": "2023-03-24T03:00:00.000Z",
            "data_pagamento": "2023-03-24T03:00:00.000Z",
            "valor": "3500.00",
            "status": false,
            "conta_id": 1665710,
            "usuario_id": 35892,
            "transferencia_id": null,
            "parcelamento_id": null
        }])

        cy.intercept({
            method: 'PUT',
            url: '/transacoes/**'
        }, [{
            "conta": "Conta para saldo",
            "id": 1558262,
            "descricao": "Movimentacao 1, calculo saldo",
            "envolvido": "CCC",
            "observacao": null,
            "tipo": "REC",
            "data_transacao": "2023-03-24T03:00:00.000Z",
            "data_pagamento": "2023-03-24T03:00:00.000Z",
            "valor": "3500.00",
            "status": false,
            "conta_id": 1665710,
            "usuario_id": 35892,
            "transferencia_id": null,
            "parcelamento_id": null
        }])
        cy.intercept('GET', '/extrato/**', { fixture: 'movimentacaoSalva' })

        cy.get(loc.MENU.HOME).click()
        cy.xpath(loc.SALDO.FN_XP_SALDO_CONTA('Carteira')).should('contain', '100')

        cy.get(loc.MENU.EXTRATO).click()
        cy.xpath(loc.EXTRATO.FN_XP_ALTERA_ELEMENTO('Movimentacao 1, calculo saldo')).click()
            //cy.wait(2000)
        cy.get(loc.MOVIMENTACAO.DESCRICAO).should('have.value', 'Movimentacao 1, calculo saldo')
        cy.get(loc.MOVIMENTACAO.STATUS).click()
        cy.get(loc.MOVIMENTACAO.BTN_MOVIM).click()
        cy.get(loc.MESSAGE).should('contain', 'sucesso')

        cy.intercept({
            method: 'GET',
            url: '/saldo'
        }, [{
                conta_id: 99999,
                conta: 'Carteira',
                saldo: '4034.00'
            },
            {
                conta_id: 99909,
                conta: 'Banco',
                saldo: '10000000.00'
            }
        ]).as('saldoFinal')

        cy.get(loc.MENU.HOME).click()
        cy.xpath(loc.SALDO.FN_XP_SALDO_CONTA('Carteira')).should('contain', '4034.00')
    })

    it('Should remove a transaction', () => {
        cy.intercept('GET', '/extrato/**', { fixture: 'movimentacaoSalva' })
        cy.intercept('DELETE', '/transacoes/**', { status: 204 })
        cy.get(loc.MENU.EXTRATO).click()
        cy.xpath(loc.EXTRATO.FN_XP_REMOVE_ELEMENTO('Movimentacao para exclusao')).click()
        cy.get(loc.MESSAGE).should('contain', 'Movimentação removida com sucesso!')
    })
})