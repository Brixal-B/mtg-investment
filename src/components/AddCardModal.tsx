"use client";
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cards: any[]) => void;
}

interface CardEntry {
  uuid: string;
  name: string;
  quantity: number;
  condition: string;
  purchase_price: number;
  purchase_date: string;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [cards, setCards] = useState<CardEntry[]>([
    {
      uuid: '',
      name: '',
      quantity: 1,
      condition: 'near_mint',
      purchase_price: 0,
      purchase_date: new Date().toISOString().split('T')[0]
    }
  ]);

  const addCardEntry = () => {
    setCards([...cards, {
      uuid: '',
      name: '',
      quantity: 1,
      condition: 'near_mint',
      purchase_price: 0,
      purchase_date: new Date().toISOString().split('T')[0]
    }]);
  };

  const updateCard = (index: number, field: keyof CardEntry, value: string | number) => {
    const updated = cards.map((card, i) => 
      i === index ? { ...card, [field]: value } : card
    );
    setCards(updated);
  };

  const removeCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validCards = cards.filter(card => card.uuid && card.name);
    if (validCards.length > 0) {
      onAdd(validCards);
      setCards([{
        uuid: '',
        name: '',
        quantity: 1,
        condition: 'near_mint',
        purchase_price: 0,
        purchase_date: new Date().toISOString().split('T')[0]
      }]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Add Cards to Collection</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {cards.map((card, index) => (
            <div key={index} className="grid grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UUID
                </label>
                <input
                  type="text"
                  value={card.uuid}
                  onChange={(e) => updateCard(index, 'uuid', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Card UUID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={card.name}
                  onChange={(e) => updateCard(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Card name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={card.quantity}
                  onChange={(e) => updateCard(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={card.condition}
                  onChange={(e) => updateCard(index, 'condition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mint">Mint</option>
                  <option value="near_mint">Near Mint</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="light_played">Light Played</option>
                  <option value="played">Played</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={card.purchase_price}
                  onChange={(e) => updateCard(index, 'purchase_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-end">
                {cards.length > 1 && (
                  <button
                    onClick={() => removeCard(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={addCardEntry}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            <Plus size={20} className="mr-2" />
            Add Another Card
          </button>

          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCardModal;