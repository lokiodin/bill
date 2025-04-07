import React, { useState, useMemo, useCallback } from 'react';

interface Person {
  id: string;
  name: string;
}

interface Dish {
  id: string;
  name: string;
  price: number;
  sharedBy: string[]; // Array of person IDs
}

interface Tax {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
}

interface BillSplit {
  [personId: string]: {
    name: string;
    amount: number;
  };
}

export default function BillSplitter() {
  const [people, setPeople] = useState<Person[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);

  const [personNameInput, setPersonNameInput] = useState('');
  const [dishNameInput, setDishNameInput] = useState('');
  const [dishPriceInput, setDishPriceInput] = useState('');
  const [taxNameInput, setTaxNameInput] = useState('');
  const [taxValueInput, setTaxValueInput] = useState('');
  const [taxTypeInput, setTaxTypeInput] = useState<'percentage' | 'fixed'>('percentage');

  // --- Add Handlers ---

  const handleAddPerson = useCallback(() => {
    if (personNameInput.trim()) {
      setPeople(prev => [...prev, { id: crypto.randomUUID(), name: personNameInput.trim() }]);
      setPersonNameInput('');
    }
  }, [personNameInput]);

  const handleAddDish = useCallback(() => {
    const price = parseFloat(dishPriceInput);
    if (dishNameInput.trim() && !isNaN(price) && price >= 0) {
      setDishes(prev => [...prev, { id: crypto.randomUUID(), name: dishNameInput.trim(), price, sharedBy: [] }]);
      setDishNameInput('');
      setDishPriceInput('');
    }
  }, [dishNameInput, dishPriceInput]);

  const handleAddTax = useCallback(() => {
    const value = parseFloat(taxValueInput);
    if (taxNameInput.trim() && !isNaN(value) && value >= 0) {
      setTaxes(prev => [...prev, { id: crypto.randomUUID(), name: taxNameInput.trim(), type: taxTypeInput, value }]);
      setTaxNameInput('');
      setTaxValueInput('');
      setTaxTypeInput('percentage');
    }
  }, [taxNameInput, taxValueInput, taxTypeInput]);

  // --- Input KeyDown Handlers ---

  const handlePersonInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddPerson();
    }
  };

  const handleDishInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // If focus is on name, move to price, if on price, add dish
      if (e.currentTarget.name === 'dishName') {
        document.querySelector<HTMLInputElement>('input[name="dishPrice"]')?.focus();
      } else if (e.currentTarget.name === 'dishPrice') {
         handleAddDish();
         document.querySelector<HTMLInputElement>('input[name="dishName"]')?.focus();
      }
    }
  };

 const handleTaxInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      // Logic to move focus or add tax
        if (e.currentTarget.name === 'taxName') {
            document.querySelector<HTMLSelectElement>('select[name="taxType"]')?.focus();
        } else if (e.currentTarget.name === 'taxType') {
            document.querySelector<HTMLInputElement>('input[name="taxValue"]')?.focus();
        } else if (e.currentTarget.name === 'taxValue') {
            handleAddTax();
            document.querySelector<HTMLInputElement>('input[name="taxName"]')?.focus();
        }
    }
 };


  // --- Edit Handlers (Inline) ---

  const handlePersonNameChange = (id: string, newName: string) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleDishNameChange = (id: string, newName: string) => {
    setDishes(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
  };

  const handleDishPriceChange = (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      setDishes(prev => prev.map(d => d.id === id ? { ...d, price } : d));
    } else if (newPrice === '') {
        // Allow clearing the field, maybe set price to 0 or handle invalid state later
         setDishes(prev => prev.map(d => d.id === id ? { ...d, price: 0 } : d));
    }
  };

   const handleTaxNameChange = (id: string, newName: string) => {
    setTaxes(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const handleTaxValueChange = (id: string, newValue: string) => {
    const value = parseFloat(newValue);
     if (!isNaN(value) && value >= 0) {
        setTaxes(prev => prev.map(t => t.id === id ? { ...t, value } : t));
     } else if (newValue === '') {
        setTaxes(prev => prev.map(t => t.id === id ? { ...t, value: 0 } : t));
     }
  };

   const handleTaxTypeChange = (id: string, newType: 'percentage' | 'fixed') => {
        setTaxes(prev => prev.map(t => t.id === id ? { ...t, type: newType } : t));
   };


  // --- Delete Handlers ---

  const handleDeletePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
    // Also remove this person from any dishes they shared
    setDishes(prev => prev.map(d => ({
      ...d,
      sharedBy: d.sharedBy.filter(personId => personId !== id)
    })));
  };

  const handleDeleteDish = (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
  };

  const handleDeleteTax = (id: string) => {
    setTaxes(prev => prev.filter(t => t.id !== id));
  };

  // --- Toggle Dish Assignment ---

  const toggleDishPerson = (dishId: string, personId: string) => {
    setDishes(prev => prev.map(dish => {
      if (dish.id === dishId) {
        const isSharing = dish.sharedBy.includes(personId);
        const newSharedBy = isSharing
          ? dish.sharedBy.filter(id => id !== personId)
          : [...dish.sharedBy, personId];
        return { ...dish, sharedBy: newSharedBy };
      }
      return dish;
    }));
  };

  // --- Calculations ---

  const subtotal = useMemo(() => {
    return dishes.reduce((sum, dish) => sum + dish.price, 0);
  }, [dishes]);

  const totalTaxAmount = useMemo(() => {
    return taxes.reduce((sum, tax) => {
      if (tax.type === 'percentage') {
        return sum + (subtotal * tax.value / 100);
      } else { // fixed
        return sum + tax.value;
      }
    }, 0);
  }, [subtotal, taxes]);

  const grandTotal = useMemo(() => {
    return subtotal + totalTaxAmount;
  }, [subtotal, totalTaxAmount]);

  const billSplit = useMemo<BillSplit>(() => {
    const split: BillSplit = {};
    const personSubtotals: { [personId: string]: number } = {};

    // Initialize split and subtotals for each person
    people.forEach(person => {
        split[person.id] = { name: person.name, amount: 0 };
        personSubtotals[person.id] = 0;
    });

    // Calculate individual base cost from dishes
    dishes.forEach(dish => {
      if (dish.sharedBy.length > 0 && dish.price > 0) {
        const share = dish.price / dish.sharedBy.length;
        dish.sharedBy.forEach(personId => {
          if (personSubtotals[personId] !== undefined) {
            personSubtotals[personId] += share;
          }
        });
      }
    });

    // Calculate final amount for each person (proportional share of grand total)
     if (subtotal > 0) {
         people.forEach(person => {
            const personSub = personSubtotals[person.id] ?? 0;
            const proportion = personSub / subtotal;
            split[person.id].amount = proportion * grandTotal;
         });
     } else if (people.length > 0) {
        // If subtotal is 0 but there are fixed taxes, split them equally
        const fixedTaxes = taxes.filter(t => t.type === 'fixed').reduce((sum, t) => sum + t.value, 0);
        const equalShare = fixedTaxes / people.length;
        people.forEach(person => {
            split[person.id].amount = equalShare;
        });
     }


    return split;
  }, [people, dishes, taxes, subtotal, grandTotal]);


  // --- Rendering ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-8">

        <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-8">Diviseur d'Addition</h1>

        {/* People Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Personnes</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={personNameInput}
              onChange={(e) => setPersonNameInput(e.target.value)}
              onKeyDown={handlePersonInputKeyDown}
              placeholder="Nom de la personne"
              className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-150 ease-in-out"
            />
            <button
              onClick={handleAddPerson}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
            >
              Ajouter Personne
            </button>
          </div>
          <ul className="space-y-2">
            {people.map((person) => (
              <li key={person.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm">
                 <input
                    type="text"
                    value={person.name}
                    onChange={(e) => handlePersonNameChange(person.id, e.target.value)}
                    className="flex-grow px-2 py-1 border border-transparent rounded hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-transparent"
                 />
                <button
                  onClick={() => handleDeletePerson(person.id)}
                  className="ml-3 text-red-500 hover:text-red-700 text-sm font-medium focus:outline-none"
                  aria-label={`Supprimer ${person.name}`}
                >
                  Supprimer
                </button>
              </li>
            ))}
             {people.length === 0 && <p className="text-gray-500 text-sm italic">Aucune personne ajoutée.</p>}
          </ul>
        </section>

        {/* Dishes Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Plats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <input
              type="text"
              name="dishName"
              value={dishNameInput}
              onChange={(e) => setDishNameInput(e.target.value)}
              onKeyDown={handleDishInputKeyDown}
              placeholder="Nom du plat"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition duration-150 ease-in-out"
            />
            <input
              type="number"
              name="dishPrice"
              value={dishPriceInput}
              onChange={(e) => setDishPriceInput(e.target.value)}
              onKeyDown={handleDishInputKeyDown}
              placeholder="Prix (€)"
              min="0"
              step="0.01"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition duration-150 ease-in-out [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Hide number arrows
            />
            <button
              onClick={handleAddDish}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out sm:col-span-1"
            >
              Ajouter Plat
            </button>
          </div>
          <ul className="space-y-3">
            {dishes.map((dish) => (
              <li key={dish.id} className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                   <div className="flex-grow flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                       <input
                        type="text"
                        value={dish.name}
                        onChange={(e) => handleDishNameChange(dish.id, e.target.value)}
                        className="px-2 py-1 border border-transparent rounded hover:border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none bg-transparent font-medium flex-grow sm:flex-grow-0 w-full sm:w-auto"
                        />
                       <input
                        type="number"
                        value={dish.price > 0 ? dish.price : ''} // Show empty if 0 for better UX
                        onChange={(e) => handleDishPriceChange(dish.id, e.target.value)}
                         min="0"
                        step="0.01"
                        className="px-2 py-1 border border-transparent rounded hover:border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none bg-transparent w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Prix (€)"
                        />
                   </div>
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium focus:outline-none self-end sm:self-center"
                    aria-label={`Supprimer ${dish.name}`}
                  >
                    Supprimer
                  </button>
                </div>
                <div className="border-t pt-3 mt-2">
                  <p className="text-sm font-medium text-gray-600 mb-2">Partagé par :</p>
                  {people.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {people.map((person) => (
                        <button
                          key={person.id}
                          onClick={() => toggleDishPerson(dish.id, person.id)}
                          className={`px-3 py-1 rounded-full text-sm transition duration-150 ease-in-out border ${
                            dish.sharedBy.includes(person.id)
                              ? 'bg-green-500 text-white border-green-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {person.name}
                        </button>
                      ))}
                    </div>
                   ) : (
                       <p className="text-xs text-gray-400 italic">Ajoutez des personnes pour assigner ce plat.</p>
                   )}
                </div>
              </li>
            ))}
            {dishes.length === 0 && <p className="text-gray-500 text-sm italic">Aucun plat ajouté.</p>}
          </ul>
        </section>

        {/* Taxes Section */}
        <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Taxes / Pourboire</h2>
             <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <input
                  type="text"
                  name="taxName"
                  value={taxNameInput}
                  onChange={(e) => setTaxNameInput(e.target.value)}
                   onKeyDown={handleTaxInputKeyDown}
                  placeholder="Nom (ex: TVA, Service)"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-150 ease-in-out"
                />
                 <select
                    name="taxType"
                    value={taxTypeInput}
                    onChange={(e) => setTaxTypeInput(e.target.value as 'percentage' | 'fixed')}
                     onKeyDown={handleTaxInputKeyDown}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-150 ease-in-out bg-white"
                    >
                    <option value="percentage">% Pourcentage</option>
                    <option value="fixed">€ Montant Fixe</option>
                 </select>
                 <input
                    type="number"
                    name="taxValue"
                    value={taxValueInput}
                    onChange={(e) => setTaxValueInput(e.target.value)}
                     onKeyDown={handleTaxInputKeyDown}
                    placeholder={taxTypeInput === 'percentage' ? 'Valeur (%)' : 'Valeur (€)'}
                    min="0"
                    step="0.01"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-150 ease-in-out [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                 />

                <button
                  onClick={handleAddTax}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                  Ajouter Taxe
                </button>
            </div>
             <ul className="space-y-2">
                {taxes.map((tax) => (
                <li key={tax.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-3 rounded-lg shadow-sm gap-2">
                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            value={tax.name}
                            onChange={(e) => handleTaxNameChange(tax.id, e.target.value)}
                             className="px-2 py-1 border border-transparent rounded hover:border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-transparent font-medium flex-grow sm:flex-grow-0 w-full sm:w-auto"
                             placeholder="Nom de la taxe"
                        />
                         <select
                            value={tax.type}
                            onChange={(e) => handleTaxTypeChange(tax.id, e.target.value as 'percentage' | 'fixed')}
                            className="px-2 py-1 border border-transparent rounded hover:border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-transparent text-sm"
                            >
                            <option value="percentage">%</option>
                            <option value="fixed">€</option>
                         </select>
                        <input
                            type="number"
                            value={tax.value > 0 ? tax.value : ''}
                            onChange={(e) => handleTaxValueChange(tax.id, e.target.value)}
                            min="0" step="0.01"
                            className="px-2 py-1 border border-transparent rounded hover:border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none bg-transparent w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="Valeur"
                        />

                   </div>
                  <button
                    onClick={() => handleDeleteTax(tax.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium focus:outline-none self-end sm:self-center"
                     aria-label={`Supprimer ${tax.name}`}
                  >
                    Supprimer
                  </button>
                </li>
                ))}
                 {taxes.length === 0 && <p className="text-gray-500 text-sm italic">Aucune taxe ou pourboire ajouté.</p>}
            </ul>
        </section>


        {/* Summary Section */}
        <section className="space-y-4 pt-6 border-t-2 border-dashed">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Récapitulatif</h2>
           <div className="space-y-3 bg-indigo-50 p-4 sm:p-6 rounded-lg shadow">
                <div className="flex justify-between items-center text-gray-600">
                    <span>Sous-total :</span>
                    <span className="font-medium">{subtotal.toFixed(2)} €</span>
                </div>
                 {taxes.map((tax) => (
                    <div key={tax.id} className="flex justify-between items-center text-gray-600 text-sm">
                        <span>{tax.name} ({tax.type === 'percentage' ? `${tax.value}%` : `${tax.value.toFixed(2)} €`}) :</span>
                         <span className="font-medium">
                            {tax.type === 'percentage'
                                ? (subtotal * tax.value / 100).toFixed(2)
                                : tax.value.toFixed(2)} €
                         </span>
                    </div>
                ))}
                <div className="flex justify-between items-center text-gray-600">
                    <span>Taxes totales :</span>
                    <span className="font-medium">{totalTaxAmount.toFixed(2)} €</span>
                </div>
                 <div className="flex justify-between items-center text-xl font-bold text-indigo-800 pt-2 mt-2 border-t border-indigo-200">
                    <span>Total Général :</span>
                    <span>{grandTotal.toFixed(2)} €</span>
                </div>
           </div>

            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-3">Montant par personne :</h3>
             {people.length > 0 ? (
                <ul className="space-y-2">
                {Object.entries(billSplit).map(([personId, data]) => (
                    <li key={personId} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-gray-800">{data.name} :</span>
                    <span className="font-semibold text-lg text-blue-700">{data.amount.toFixed(2)} €</span>
                    </li>
                ))}
                </ul>
             ) : (
                 <p className="text-gray-500 italic">Ajoutez des personnes et assignez-leur des plats pour voir le détail.</p>
             )}
        </section>

      </div>
       <footer className="text-center mt-8 text-gray-500 text-sm">
           Application de partage d'addition - Créé pour GitHub Pages.
       </footer>
    </div>
  );
}